import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../../enum/error-code.enum';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  Admin,
  AdminAuthResponse,
  AdminJwtPayload,
} from './interfaces/admin.interface';
import {
  AdminSelectFieldDto,
  AuthAdminDto,
  CreateAdminDto,
  FilterAndPaginationAdminDto,
  RequestPasswordResetDto,
  UpdateAdminDto,
  VerifyPasswordResetDto,
  VerifyTwoFactorDto,
} from './dto/admin.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { Response } from 'express';
import { EmailService } from '../../shared/email/email.service';
import { Shop } from '../shop/interfaces/shop.interface';


const ObjectId = Types.ObjectId;
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ALLOWED = 3;
const ACCOUNT_LOCK_HOURS = 24;
const IP_BLOCK_HOURS = 24;
const TWO_FA_IP_WINDOW_MIN = 10; // check last 10 minutes
const TWO_FA_IP_FAIL_LIMIT = 20; // 20+ invalid 2FA → 1h IP block
const TWO_FA_IP_BLOCK_HOURS = 1; // IP block duration
const TWO_FA_ADMIN_WINDOW_MIN = 10; // last 10 minutes
const TWO_FA_ADMIN_FAIL_LIMIT = 12; // 12+ invalid 2FA → 24h lock
const TWO_FA_MAX_ATTEMPTS = 5;
const PASSWORD_MAX_AGE_DAYS = Number(30);
const TWO_FA_TTL_MIN = Number(10);
const ACCOUNT_HOLDER_EMAIL = 'sakibs.ngn@gmail.com';

@Injectable()
export class AdminService {
  private logger = new Logger(AdminService.name);

  constructor(
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    @InjectModel('AdminSession') private readonly sessionModel: Model<any>,
    @InjectModel('AdminSecurity') private readonly securityModel: Model<any>, // ✅ unified model
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    protected jwtService: JwtService,
    private configService: ConfigService,
    private utilsService: UtilsService,
    private emailService: EmailService,
  ) { }

  // ================== tokens & cookies (unchanged) ==================
  private getAccessTtl(): string {
    return this.configService.get<string>('adminAccessTokenTtl') || '15m';
  }
  private getRefreshTtlDays(): number {
    return Number(this.configService.get('adminRefreshTokenTtlDays') || 30);
  }
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async countRecentInvalid2faByIp(ip?: string): Promise<number> {
    if (!ip) return 0;
    const since = new Date(Date.now() - TWO_FA_IP_WINDOW_MIN * 60 * 1000);
    return this.securityModel.countDocuments({
      kind: 'attempt',
      ip,
      reason: 'invalid_2fa_code',
      createdAt: { $gte: since },
    });
  }

  private async countRecentInvalid2faByAdmin(adminId: string): Promise<number> {
    const since = new Date(Date.now() - TWO_FA_ADMIN_WINDOW_MIN * 60 * 1000);
    // attempt logs store only username/ip; আমরা twofactor doc থেকেও বানাতে পারি,
    // কিন্তু এখানে attempt logs-ই যথেষ্ট (verify-তে already recordAttempt করা হচ্ছে)।
    return this.securityModel.countDocuments({
      kind: 'attempt',
      reason: 'invalid_2fa_code',
      createdAt: { $gte: since },
      // admin mapping এর সহজ উপায়: twofactor tf.adminId জানা থাকায় আমরা extra filter দেব না।
      // চাইলে এখানে adminId ফিল্ড যোগ করে attempt log-এও সেভ করতে পারেন।
    });
  }

  private setRefreshCookie(res: Response, token: string) {
    const isProd = this.configService.get<boolean>('productionBuild');
    const domain = this.configService.get<string>('adminBaseUrl');
    res.cookie('admin_refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain,
      path: '/',
      maxAge: this.getRefreshTtlDays() * 24 * 60 * 60 * 1000,
    });
    res.cookie('has_admin_refresh', '1', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      domain,
      path: '/',
      maxAge: this.getRefreshTtlDays() * 24 * 60 * 60 * 1000,
    });
  }
  private clearRefreshCookie(res: Response) {
    const isProd = this.configService.get<boolean>('productionBuild');
    const domain = this.configService.get<string>('adminBaseUrl');
    res.clearCookie('admin_refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain,
      path: '/',
    });
    res.clearCookie('has_admin_refresh', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      domain,
      path: '/',
    });
  }
  private async issueTokens(admin: Admin, sessionId: string) {
    const jwtSecret = this.configService.get<string>('adminJwtSecret');
    const payload: AdminJwtPayload & { sessionId: string } = {
      _id: admin._id as any,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions as any,
      sessionId,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: this.getAccessTtl() as any,
    });
    return { accessToken };
  }
  private genOpaqueToken(length = 64): string {
    const alphabet =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++)
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }

  // ================== helpers (unified storage) ==================
  private sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
  private deviceId(username: string, ua?: string, ip?: string) {
    return this.sha256([username || '', ua || '', ip || ''].join('|'));
  }

  /** Attempts */
  private async recordAttempt(
    adminUsername: string,
    ip: string | undefined,
    ua: string | undefined,
    success: boolean,
    reason?: string,
  ) {
    try {
      await this.securityModel.create({
        kind: 'attempt',
        adminUsername,
        ip,
        userAgent: ua,
        success,
        reason,
        createdAt: new Date(),
      });
    } catch (e) {
      this.logger.warn('recordAttempt() failed: ' + e?.message);
    }
  }

  /** IP block */
  private async isIpBlocked(ip?: string): Promise<boolean> {
    if (!ip) return false;
    const doc = await this.securityModel
      .findOne({
        kind: 'ip_block',
        ip,
        blockedUntil: { $gt: new Date() },
      })
      .lean();
    return !!doc;
  }
  private async blockIp(ip: string, reason = 'too_many_failures') {
    if (!ip) return;
    const until = new Date(Date.now() + IP_BLOCK_HOURS * 60 * 60 * 1000);
    await this.securityModel.updateOne(
      { kind: 'ip_block', ip },
      { $set: { kind: 'ip_block', ip, blockedUntil: until, reason } },
      { upsert: true },
    );
  }

  /** Admin security counters */
  private async increaseFailed(admin: any) {
    const failed = (admin.security?.failedCount || 0) + 1;
    const update: any = { 'security.failedCount': failed };
    if (failed >= MAX_FAILED_ALLOWED) {
      update['security.lockUntil'] = new Date(
        Date.now() + ACCOUNT_LOCK_HOURS * 60 * 60 * 1000,
      );
    }
    await this.adminModel.updateOne({ _id: admin._id }, { $set: update });
    return failed;
  }
  private async resetFailedOnSuccess(adminId: string) {
    await this.adminModel.updateOne(
      { _id: adminId },
      { $set: { 'security.failedCount': 0, 'security.lockUntil': null } },
    );
  }
  private isLocked(admin: any): boolean {
    const lockUntil = admin.security?.lockUntil;
    return !!(lockUntil && new Date(lockUntil) > new Date());
  }

  /** Notifications */
  private async notifySuspicious(admin: any, subject: string, html: string) {
    if (!admin?.email) return;
    try {
      this.emailService.sendEmailAdmin(ACCOUNT_HOLDER_EMAIL, subject, html, {
        websiteName: 'Tradition Super Admin Panel',
      });
    } catch (e) {
      this.logger.warn('notifySuspicious() failed: ' + e?.message);
    }
  }
  private suspiciousHtml(title: string, lines: string[]) {
    return `<div style="font-family:Arial, sans-serif;">
      <h3>${title}</h3>
      <ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
      <p>If this wasn't you, please reset password and contact support.</p>
    </div>`;
  }

  /** 2FA helpers (stored in AdminSecurity with kind='twofactor') */
  private newTwoFactorCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  private twoFactorExpiresAt(): Date {
    return new Date(Date.now() + TWO_FA_TTL_MIN * 60 * 1000);
  }
  private async createTwoFactor(adminId: string, ip?: string, ua?: string) {
    const code = this.newTwoFactorCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const doc = await this.securityModel.create({
      kind: 'twofactor',
      adminId: new ObjectId(adminId),
      codeHash,
      ip,
      userAgent: ua,
      expiresAt: this.twoFactorExpiresAt(),
      attempts: 0,
    });
    return { twoFactorId: doc._id, code };
  }
  private async getTwoFactor(twoFactorId: string) {
    return this.securityModel.findOne({
      _id: new ObjectId(twoFactorId),
      kind: 'twofactor',
    });
  }
  private async consumeTwoFactor(tfId: any) {
    await this.securityModel.updateOne(
      { _id: tfId, kind: 'twofactor' },
      { $set: { consumedAt: new Date() } },
    );
  }
  private async incTwoFactorAttempt(tfId: any) {
    await this.securityModel.updateOne(
      { _id: tfId, kind: 'twofactor' },
      { $inc: { attempts: 1 } },
    );
  }

  // ================== LOGIN + 2FA FLOW ==================
  async adminLoginWithSession(
    authAdminDto: AuthAdminDto,
    meta: { ua?: string; ip?: string },
    res: Response,
  ): Promise<AdminAuthResponse> {
    try {
      const { username, password } = authAdminDto;
      const ip = meta.ip;
      const ua = meta.ua;

      if (await this.isIpBlocked(ip)) {
        await this.recordAttempt(username, ip, ua, false, 'ip_blocked');
        throw new ForbiddenException(
          'Your IP is temporarily blocked. Try later.',
        );
      }

      const user = await this.adminModel
        .findOne({ username })
        .select('password username role permissions hasAccess email security')
        .lean();

      if (!user) {
        await this.recordAttempt(username, ip, ua, false, 'invalid_username');
        return { success: false, message: 'Username is invalid' };
      }
      if (!user.hasAccess) {
        await this.recordAttempt(username, ip, ua, false, 'no_access');
        return { success: false, message: 'No Access for Login' };
      }
      if (this.isLocked(user)) {
        await this.recordAttempt(username, ip, ua, false, 'account_locked');
        return {
          success: false,
          message: 'Account is locked for 24h due to failed attempts.',
        };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const failed = await this.increaseFailed(user);
        await this.recordAttempt(username, ip, ua, false, 'invalid_password');

        if (failed >= MAX_FAILED_ALLOWED) {
          await this.blockIp(ip || '', 'too_many_failures');
          await this.notifySuspicious(
            user,
            '⚠️ Multiple failed login attempts',
            this.suspiciousHtml(
              'Tradition Super Admin - Suspicious Login Activity',
              [
                `Username: ${username}`,
                `IP: ${ip ?? '-'}`,
                `User-Agent: ${ua ?? '-'}`,
                `Time: ${new Date().toISOString()}`,
                `Status: Account locked for ${ACCOUNT_LOCK_HOURS}h`,
              ],
            ),
          );
          return {
            success: false,
            message: 'Too many failed attempts. Account locked for 24h.',
          };
        }
        return { success: false, message: 'Password not matched!' };
      }

      // Password OK → 2FA
      const devId = this.deviceId(user.username, ua, ip);
      const dbUser = await this.adminModel
        .findById(user._id)
        .select('email security')
        .lean();
      const known = (dbUser?.security?.devices || []).some(
        (d: any) => d.deviceId === devId,
      );
      if (!known) {
        await this.notifySuspicious(
          user,
          '🔔 New device sign-in attempt',
          this.suspiciousHtml('Tradition Super Admin - New Device Detected', [
            `Username: ${user.username}`,
            `IP: ${ip ?? '-'}`,
            `User-Agent: ${ua ?? '-'}`,
            `Time: ${new Date().toISOString()}`,
          ]),
        );
      }

      // TEMPORARILY BYPASSING 2FA
      // The frontend currently has no UI for 2FA, so we create the session directly.

      const refreshOpaque = this.genOpaqueToken(64);
      const refreshHash = await bcrypt.hash(refreshOpaque, 12);
      const now = new Date();
      const refreshDays = this.getRefreshTtlDays();
      const expiresAt = new Date(now.getTime() + refreshDays * 24 * 60 * 60 * 1000);

      const sessionDoc = await this.sessionModel.create({
        adminId: user._id,
        userAgent: ua,
        ip: ip,
        refreshTokenHash: refreshHash,
        createdAt: now,
        lastUsedAt: now,
        expiresAt,
      });

      const { accessToken } = await this.issueTokens(user as any, sessionDoc._id.toString());

      await this.adminModel.updateOne(
        { _id: user._id },
        { $set: { 'security.failedCount': 0, 'security.lockUntil': null, lastLoggedIn: this.utilsService.getDateWithCurrentTime(new Date()) } },
      );

      if (res) this.setRefreshCookie(res, refreshOpaque);
      await this.recordAttempt(username, ip, ua, true, 'login_success');

      return {
        success: true,
        message: 'Login success!',
        data: {
          _id: user._id,
          role: user.role,
          permissions: user.permissions,
          sessionId: sessionDoc._id,
        },
        token: accessToken,
        tokenExpiredIn: this.getAccessTtl() as any,
      };
    } catch (err: any) {
      if (err.code && err.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async verifyTwoFactorAndIssue(
    dto: { twoFactorId: string; code: string },
    meta: { ua?: string; ip?: string },
    res: import('express').Response,
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
    token?: string | null;
    tokenExpiredIn?: string | number | null;
  }> {
    const { twoFactorId, code } = dto;

    // --- Load twofactor doc ---
    const tf = await this.securityModel.findOne({
      _id: new ObjectId(twoFactorId),
      kind: 'twofactor',
    });

    if (!tf) throw new BadRequestException('Invalid or expired 2FA request');
    if (tf.consumedAt) throw new BadRequestException('2FA already used');
    if (new Date(tf.expiresAt) <= new Date()) {
      throw new BadRequestException('2FA expired. Please login again.');
    }
    if ((tf.attempts || 0) >= TWO_FA_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many 2FA attempts. Please login again.',
      );
    }

    // --- Load admin ---
    const admin = await this.adminModel
      .findById(tf.adminId)
      .select('username role permissions hasAccess email security')
      .lean();

    if (!admin || !admin.hasAccess) {
      throw new UnauthorizedException('Account disabled');
    }

    // --- Verify code ---
    const ok = await bcrypt.compare(String(code || ''), tf.codeHash);
    if (!ok) {
      // tiny backoff to slow brute-force
      await new Promise((r) => setTimeout(r, 500));

      // inc attempts on this twofactor
      await this.securityModel.updateOne(
        { _id: tf._id, kind: 'twofactor' },
        { $inc: { attempts: 1 } },
      );

      // record attempt log
      await this.securityModel.create({
        kind: 'attempt',
        adminUsername: admin.username,
        ip: meta.ip,
        userAgent: meta.ua,
        success: false,
        reason: 'invalid_2fa_code',
        createdAt: new Date(),
      });

      // per-twofactor hard cap
      const newAttempts = (tf.attempts || 0) + 1;
      if (newAttempts >= TWO_FA_MAX_ATTEMPTS) {
        await this.securityModel.updateOne(
          { _id: tf._id, kind: 'twofactor' },
          { $set: { consumedAt: new Date() } },
        );
        throw new UnauthorizedException(
          'Too many 2FA attempts. Please login again.',
        );
      }

      // IP-based throttling (rolling window)
      if (meta.ip) {
        const ipSince = new Date(Date.now() - TWO_FA_IP_WINDOW_MIN * 60 * 1000);
        const recentIpFails = await this.securityModel.countDocuments({
          kind: 'attempt',
          ip: meta.ip,
          reason: 'invalid_2fa_code',
          createdAt: { $gte: ipSince },
        });
        if (recentIpFails >= TWO_FA_IP_FAIL_LIMIT) {
          const until = new Date(
            Date.now() + TWO_FA_IP_BLOCK_HOURS * 60 * 60 * 1000,
          );
          await this.securityModel.updateOne(
            { kind: 'ip_block', ip: meta.ip },
            {
              $set: {
                kind: 'ip_block',
                ip: meta.ip,
                blockedUntil: until,
                reason: 'too_many_2fa_failures',
              },
            },
            { upsert: true },
          );

          // notify admin by email
          await this.notifySuspicious(
            admin,
            '⚠️ 2FA brute-force detected (IP blocked)',
            this.suspiciousHtml(
              'Tradition Super Admin - 2FA Brute-force Throttled',
              [
                `IP: ${meta.ip ?? '-'}`,
                `User-Agent: ${meta.ua ?? '-'}`,
                `Window: last ${TWO_FA_IP_WINDOW_MIN}m`,
                `Failures: ${recentIpFails}+`,
                `Blocked: ${TWO_FA_IP_BLOCK_HOURS}h`,
              ],
            ),
          );

          throw new UnauthorizedException(
            'Too many 2FA attempts from your IP. Try again later.',
          );
        }
      }

      // Admin-based throttling (rolling window)
      const adminSince = new Date(
        Date.now() - TWO_FA_ADMIN_WINDOW_MIN * 60 * 1000,
      );
      const recentAdminFails = await this.securityModel.countDocuments({
        kind: 'attempt',
        adminUsername: admin.username,
        reason: 'invalid_2fa_code',
        createdAt: { $gte: adminSince },
      });
      if (recentAdminFails >= TWO_FA_ADMIN_FAIL_LIMIT) {
        await this.adminModel.updateOne(
          { _id: tf.adminId },
          {
            $set: {
              'security.lockUntil': new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
        );

        await this.notifySuspicious(
          admin,
          '⚠️ 2FA brute-force detected (account locked)',
          this.suspiciousHtml(
            'Tradition Super Admin - 2FA Brute-force on Account',
            [
              `Username: ${admin.username}`,
              `IP (latest): ${meta.ip ?? '-'}`,
              `Window: last ${TWO_FA_ADMIN_WINDOW_MIN}m`,
              `Failures: ${recentAdminFails}+`,
              `Locked: 24h`,
            ],
          ),
        );

        throw new UnauthorizedException(
          'Too many attempts. Account locked for 24 hours.',
        );
      }

      // default invalid
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // --- success: consume this 2FA ---
    await this.securityModel.updateOne(
      { _id: tf._id, kind: 'twofactor' },
      { $set: { consumedAt: new Date() } },
    );

    // --- create session + tokens ---
    const refreshOpaque = this.genOpaqueToken(64);
    const refreshHash = await bcrypt.hash(refreshOpaque, 12);
    const now = new Date();
    const refreshDays = this.getRefreshTtlDays();
    const expiresAt = new Date(
      now.getTime() + refreshDays * 24 * 60 * 60 * 1000,
    );

    const sessionDoc = await this.sessionModel.create({
      adminId: admin._id,
      userAgent: meta.ua,
      ip: meta.ip,
      refreshTokenHash: refreshHash,
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
    });

    const { accessToken } = await this.issueTokens(
      admin as any,
      sessionDoc._id.toString(),
    );

    // --- reset failed counters ---
    await this.adminModel.updateOne(
      { _id: admin._id },
      { $set: { 'security.failedCount': 0, 'security.lockUntil': null } },
    );

    // --- device tracking (username|ua|ip hash) ---
    const devId = crypto
      .createHash('sha256')
      .update([admin.username || '', meta.ua || '', meta.ip || ''].join('|'))
      .digest('hex');

    await this.adminModel.updateOne(
      { _id: admin._id, 'security.devices.deviceId': { $ne: devId } },
      {
        $push: {
          'security.devices': {
            deviceId: devId,
            userAgent: meta.ua,
            ip: meta.ip,
            firstSeen: new Date(),
            lastSeen: new Date(),
          },
        },
      },
    );
    await this.adminModel.updateOne(
      { _id: admin._id, 'security.devices.deviceId': devId },
      { $set: { 'security.devices.$.lastSeen': new Date() } },
    );

    // --- update last login ---
    await this.adminModel.findByIdAndUpdate(admin._id, {
      $set: {
        lastLoggedIn: this.utilsService.getDateWithCurrentTime(new Date()),
      },
    });

    // --- set refresh cookie ---
    if (res) this.setRefreshCookie(res, refreshOpaque);

    // --- record success attempt ---
    await this.securityModel.create({
      kind: 'attempt',
      adminUsername: admin.username,
      ip: meta.ip,
      userAgent: meta.ua,
      success: true,
      reason: 'login_success',
      createdAt: new Date(),
    });

    // --- Create activity log for login ---
    // Log creation skipped since activityLogService is removed

    return {
      success: true,
      message: 'Login success!',
      data: {
        _id: admin._id,
        role: admin.role,
        permissions: admin.permissions,
        sessionId: sessionDoc._id,
      },
      token: accessToken,
      tokenExpiredIn: this.getAccessTtl() as any,
    };
  }

  // ====== Refresh flow (unchanged except security meta update) ======
  async rotateRefreshAndIssue(
    providedRefreshToken: string | undefined,
    meta: { ua?: string; ip?: string },
    res: Response,
  ): Promise<AdminAuthResponse> {
    if (!providedRefreshToken)
      throw new UnauthorizedException('No refresh token');

    const sessions = await this.sessionModel.find({
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    let match: any = null;
    for (const s of sessions) {
      const ok = await bcrypt.compare(providedRefreshToken, s.refreshTokenHash);
      if (ok) {
        match = s;
        break;
      }
    }
    if (!match) throw new UnauthorizedException('Invalid refresh token');

    const admin = await this.adminModel
      .findById(match.adminId)
      .select('username role permissions hasAccess');
    if (!admin || !admin.hasAccess)
      throw new UnauthorizedException('Account disabled');

    const newOpaque = this.genOpaqueToken(64);
    const newHash = await bcrypt.hash(newOpaque, BCRYPT_ROUNDS);

    await this.sessionModel.findByIdAndUpdate(match._id, {
      $set: {
        refreshTokenHash: newHash,
        lastUsedAt: new Date(),
        userAgent: meta.ua || match.userAgent,
        ip: meta.ip || match.ip,
      },
    });

    const { accessToken } = await this.issueTokens(
      admin as any,
      match._id.toString(),
    );
    if (res) this.setRefreshCookie(res, newOpaque);

    return {
      success: true,
      message: 'Refreshed',
      data: {
        _id: admin._id,
        role: admin.role,
        permissions: admin.permissions,
        sessionId: match._id,
      },
      token: accessToken,
      tokenExpiredIn: this.getAccessTtl() as any,
    };
  }

  // ====== Session ops (unchanged) ======
  async revokeSessionById(
    sessionId: string,
    byAdminId?: string,
    reason?: string,
  ): Promise<ResponsePayload> {
    const s = await this.sessionModel.findById(sessionId);
    if (!s) throw new NotFoundException('Session not found');

    if (s.revokedAt) return { success: true, message: 'Already revoked' };

    // Get admin info before revoking
    const admin = await this.adminModel.findById(s.adminId).select('username').lean();

    s.revokedAt = new Date();
    s.revokedBy = byAdminId ? new ObjectId(byAdminId) : null;
    s.reason = reason || 'Revoked';
    await s.save();

    // --- Create activity log for logout ---
    // Log creation skipped since activityLogService is removed

    return { success: true, message: 'Session revoked' };
  }

  async revokeAllSessionsForAdmin(
    adminId: string,
    byAdminId?: string,
    reason?: string,
  ): Promise<ResponsePayload> {
    await this.sessionModel.updateMany(
      { adminId: new ObjectId(adminId), revokedAt: null },
      {
        $set: {
          revokedAt: new Date(),
          revokedBy: byAdminId ? new ObjectId(byAdminId) : null,
          reason: reason || 'Bulk revoke',
        },
      },
    );
    return { success: true, message: 'All sessions revoked for this admin' };
  }

  async listSessions(
    adminId?: string,
    activeOnly = true,
  ): Promise<ResponsePayload> {
    try {
      const q: any = {};
      if (adminId) q.adminId = new ObjectId(adminId);
      if (activeOnly) {
        q.revokedAt = null;
        q.expiresAt = { $gt: new Date() };
      }
      const data = await this.sessionModel
        .find(q)
        .select(
          '_id adminId userAgent ip createdAt lastUsedAt expiresAt revokedAt revokedBy reason',
        )
        .sort({ lastUsedAt: -1 })
        .lean();

      return { success: true, message: 'Success', data, count: data.length };
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException();
    }
  }

  async listSecurity(): Promise<ResponsePayload> {
    try {
      const data = await this.securityModel
        .find({})
        .select('-codeHash')
        .sort({ updatedAt: -1 })
        .lean();

      return { success: true, message: 'Success', data, count: data.length };
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Admin Signup
   * Admin Login
   */
  async adminSignup(createAdminDto: CreateAdminDto): Promise<ResponsePayload> {
    const { password } = createAdminDto;
    const salt = await bcrypt.genSalt();
    const hashedPass = await bcrypt.hash(password, salt);

    const defaultData = {
      password: hashedPass,
      readOnly: false,
      registrationAt: this.utilsService.getDateString(new Date()),
      lastLoggedIn: null,
    };
    const mData = { ...createAdminDto, ...defaultData };
    const newUser = new this.adminModel(mData);
    try {
      const saveData = await newUser.save();
      const data = {
        username: saveData.username,
        name: saveData.name,
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Registration Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      // console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async adminLogin(authAdminDto: AuthAdminDto): Promise<AdminAuthResponse> {
    try {
      const user = (await this.adminModel
        .findOne({ username: authAdminDto.username })
        .select('password username role permissions hasAccess')) as Admin;

      if (!user) {
        return {
          success: false,
          message: 'Username is invalid',
        } as AdminAuthResponse;
      }

      if (!user.hasAccess) {
        return {
          success: false,
          message: 'No Access for Login',
        } as AdminAuthResponse;
      }

      const isMatch = await bcrypt.compare(
        authAdminDto.password,
        user.password,
      );

      if (isMatch) {
        const payload: AdminJwtPayload = {
          _id: user._id,
          username: user.username,
          role: user.role,
          permissions: user.permissions,
        };
        const jwtSecret = this.configService.get<string>('adminJwtSecret');
        const expiresInDays = this.configService.get<number>(
          'adminTokenExpiredDays',
        );

        const accessToken = this.jwtService.sign(payload, {
          secret: jwtSecret,
          expiresIn: expiresInDays,
        });
        // Update Login Info
        await this.adminModel.findByIdAndUpdate(user._id, {
          $set: {
            lastLoggedIn: this.utilsService.getDateWithCurrentTime(new Date()),
          },
        });

        return {
          success: true,
          message: 'Login success!',
          data: {
            _id: user._id,
            role: user.role,
            permissions: user.permissions,
          },
          token: accessToken,
          tokenExpiredInDays: expiresInDays,
        } as AdminAuthResponse;
      } else {
        return {
          success: false,
          message: 'Password not matched!',
          data: null,
          token: null,
          tokenExpiredIn: null,
        } as AdminAuthResponse;
      }
    } catch (error) {
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  /**
   * Logged-in Admin Info
   * Get All Admins V3 (Filter, Pagination, Select, Sort, Search Query with Aggregation) ** Recommended
   * Get All Admins by Search
   */

  async getLoggedInAdminData(
    admin: Admin,
    selectQuery: AdminSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = selectQuery;
      if (!select) {
        select = '-password';
      }
      const data = await this.adminModel.findById(admin._id).select(select);
      return {
        data,
        success: true,
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(`${admin.username} is failed to retrieve data`);
      // console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async getAllAdmins(
    filterAdminDto: FilterAndPaginationAdminDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterAdminDto;
    const { pagination } = filterAdminDto;
    const { sort } = filterAdminDto;
    const { select } = filterAdminDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ name: new RegExp(searchQuery, 'i') } };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      // Remove Sensitive Select
      delete select.password;
      mSelect = { ...mSelect, ...select };
    } else {
      mSelect = { password: 0 };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      // Remove Sensitive Select
      delete mSelect['password'];
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: { password: 0 } },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);

      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.adminModel.aggregate(aggregateStages);
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get Admin by ID
   * Update Logged In Admin Info
   * Change Logged In Admin Password
   * Update Admin by Id
   * Update Multiple Admin By Id
   * Delete Admin by Id
   * Delete Multiple Admin By Id
   */
  async getAdminById(
    id: string,
    adminSelectFieldDto: AdminSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = adminSelectFieldDto;
      if (!select) {
        select = '-password';
      }
      const data = await this.adminModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateLoggedInAdminInfo(
    admin: Admin,
    updateAdminDto: UpdateAdminDto,
  ): Promise<ResponsePayload> {
    const { password, username } = updateAdminDto;
    let user;
    try {
      user = await this.adminModel.findById(admin._id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No Admin found!');
    }
    try {
      // Remove Sensitive Fields
      if (updateAdminDto.role) {
        delete updateAdminDto.role;
      }
      if (updateAdminDto.permissions) {
        delete updateAdminDto.permissions;
      }

      // Check Username
      if (username) {
        const isExists = await this.adminModel.findOne({ username });
        if (isExists) {
          return {
            success: false,
            message: 'Username already exists',
          } as ResponsePayload;
        }
      }
      // Check Password
      if (password) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(password, salt);
        await this.adminModel.findByIdAndUpdate(admin._id, {
          $set: { ...updateAdminDto, ...{ password: hashedPass } },
        });
        return {
          success: true,
          message: 'Data & Password changed success',
        } as ResponsePayload;
      }
      await this.adminModel.findByIdAndUpdate(admin._id, {
        $set: updateAdminDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  /** ✅ Policy status helper */
  private buildPolicyStatus(admin: any) {
    // ⬇️ passwordChangedAt missing হলে force reset only
    const missing = !admin.passwordChangedAt;
    if (missing) {
      return {
        maxAgeDays: PASSWORD_MAX_AGE_DAYS,
        daysSinceChanged: null,
        mustChange: true,
        requireResetOnly: true,
      };
    }

    const last = new Date(admin.passwordChangedAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      maxAgeDays: PASSWORD_MAX_AGE_DAYS,
      daysSinceChanged: diffDays,
      mustChange: diffDays >= PASSWORD_MAX_AGE_DAYS,
      requireResetOnly: false,
    };
  }

  /** ✅ GET policy for FE */
  async getPasswordPolicyStatus(admind: any) {
    const admin = await this.adminModel
      .findById(admind._id)
      .select('email passwordChangedAt');
    if (!admin) throw new NotFoundException('No Admin found!');
    const policy = this.buildPolicyStatus(admin);
    const email = admin.email || '';
    const masked = email ? email.replace(/(.{2}).+(@.+)/, '$1****$2') : '';
    return {
      success: true,
      data: {
        emailMasked: masked,
        ...policy,
      },
    };
  }

  /** 🔁 Change password with old password */
  async changeLoggedInAdminPassword(
    admind: any,
    changePasswordDto: ChangePasswordDto,
  ) {
    const { password, oldPassword } = changePasswordDto;
    const admin = await this.adminModel
      .findById(admind._id)
      .select('password security passwordChangedAt email');
    if (!admin) throw new NotFoundException('No Admin found!');

    // ⬇️ First-time (legacy) docs: force reset only
    if (!admin.passwordChangedAt) {
      throw new ForbiddenException(
        'Password reset required. Please use OTP reset to set your password the first time.',
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return { success: false, message: 'Old password is incorrect!' };
    }

    const salt = await bcrypt.genSalt();
    const hashedPass = await bcrypt.hash(password, salt);

    await this.adminModel.findByIdAndUpdate(admin._id, {
      $set: {
        password: hashedPass,
        passwordChangedAt: new Date(),
        'security.passwordReset': undefined,
      },
    });

    return { success: true, message: 'Password changed successfully.' };
  }

  /** ✉️ Request reset OTP (when old password forgotten) */
  async requestPasswordResetForLoggedInAdmin(
    admind: any,
    _dto: RequestPasswordResetDto,
  ) {
    const admin = await this.adminModel
      .findById(admind._id)
      .select('email security');
    if (!admin) throw new NotFoundException('No Admin found!');
    if (!admin.email)
      throw new BadRequestException('No email bound to this account.');

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt();
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(Date.now() + TWO_FA_TTL_MIN * 60 * 1000);

    await this.adminModel.findByIdAndUpdate(admin._id, {
      $set: {
        'security.passwordReset': { codeHash, expiresAt, attempts: 0 },
      },
    });

    console.log('TWO_FACT_CODE', code);

    // Send email
    this.emailService.sendEmailAdmin(
      ACCOUNT_HOLDER_EMAIL,
      'Password Reset OTP',
      `<p>Your password reset code is: <b>${code}</b></p><p>This code will expire in ${TWO_FA_TTL_MIN} minutes.</p>`,
      { websiteName: 'Tradition Super Admin Panel' },
    );

    return { success: true, message: 'OTP sent to your email.' };
  }

  /** ✅ Verify OTP & set new password */
  async verifyResetAndSetNewPassword(admind: any, dto: VerifyPasswordResetDto) {
    const admin = await this.adminModel
      .findById(admind._id)
      .select('security password');
    if (!admin) throw new NotFoundException('No Admin found!');

    const pr = admin.security?.passwordReset;
    if (!pr?.codeHash || !pr?.expiresAt)
      throw new BadRequestException('No active reset request.');

    if (new Date(pr.expiresAt).getTime() < Date.now()) {
      await this.adminModel.findByIdAndUpdate(admin._id, {
        $unset: { 'security.passwordReset': '' },
      });
      throw new ForbiddenException('OTP expired. Please request a new one.');
    }

    // Brute safety
    if (pr.attempts >= 5) {
      await this.adminModel.findByIdAndUpdate(admin._id, {
        $unset: { 'security.passwordReset': '' },
      });
      throw new ForbiddenException('Too many attempts. Request a new OTP.');
    }

    const isOk = await bcrypt.compare(dto.code, pr.codeHash);
    if (!isOk) {
      await this.adminModel.findByIdAndUpdate(admin._id, {
        $inc: { 'security.passwordReset.attempts': 1 },
      });
      throw new BadRequestException('Invalid code. Please try again.');
    }

    const salt = await bcrypt.genSalt();
    const hashedPass = await bcrypt.hash(dto.newPassword, salt);

    await this.adminModel.findByIdAndUpdate(admin._id, {
      $set: {
        password: hashedPass,
        passwordChangedAt: new Date(), // ✅ reset age
      },
      $unset: { 'security.passwordReset': '' },
    });

    return { success: true, message: 'Password reset successfully.' };
  }

  async updateAdminById(
    id: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<ResponsePayload> {
    const { newPassword, username } = updateAdminDto;
    let user;
    try {
      user = await this.adminModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No Admin found!');
    }
    try {
      // Delete No Multiple Action Data
      if (updateAdminDto.hasOwnProperty('password')) {
        delete updateAdminDto.password;
      }

      // Check Username
      if (username) {
        if (user.username !== username) {
          const isExists = await this.adminModel.findOne({ username });
          if (isExists) {
            return {
              success: false,
              message: 'Username already exists',
            } as ResponsePayload;
          }
        }
      }

      // Check Password
      if (newPassword) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(newPassword, salt);
        await this.adminModel.findByIdAndUpdate(id, {
          $set: { ...updateAdminDto, ...{ password: hashedPass } },
        });
        return {
          success: true,
          message: 'Data & Password changed success',
        } as ResponsePayload;
      }
      await this.adminModel.findByIdAndUpdate(id, {
        $set: updateAdminDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleAdminById(
    ids: string[],
    updateAdminDto: UpdateAdminDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    // Delete No Multiple Action Data
    if (updateAdminDto.hasOwnProperty('password')) {
      delete updateAdminDto.password;
    }

    if (updateAdminDto.hasOwnProperty('username')) {
      delete updateAdminDto.username;
    }

    if (updateAdminDto.ids) {
      delete updateAdminDto.ids;
    }

    try {
      await this.adminModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateAdminDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteAdminById(id: string): Promise<ResponsePayload> {
    let user;
    try {
      user = await this.adminModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No Admin found!');
    }
    try {
      await this.adminModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async deleteMultipleAdminById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.adminModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSessionAdminById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.sessionModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleAttemptsAdminById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.securityModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleAdminByIdByVendor(
    vendor: Vendor,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      // const fShop = await this.shopModel.exists({
      //   _id: shop,
      //   'users._id': vendor._id,
      // });
      //
      // if (!fShop) {
      //   return {
      //     success: false,
      //     message: 'Sorry! you have no access in this shop',
      //   } as ResponsePayload;
      // }

      await this.adminModel.updateMany(
        { _id: ids },
        {
          $set: {
            status: 'trash',
            deleteDateString: this.utilsService.getDateString(new Date()),
          },
        },
      );
      return {
        success: true,
        message: 'Success! User deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
