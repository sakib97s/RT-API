import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminService } from './admin.service';
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
import { AdminAuthResponse } from './interfaces/admin.interface';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminMetaRoles } from './decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { AdminMetaPermissions } from './decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from './guards/admin-permission.guard';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';
import { DeleteCategoryDto } from '../catalog/category/dto/category.dto';
import { AffiliateAuthGuard } from '../affiliate/guards/affiliate-auth.guard';
import { Response } from 'express';
import { UtilsService } from '../../shared/utils/utils.service';

@Controller('admin')
export class AdminController {
  private logger = new Logger(AdminController.name);

  constructor(
    private adminService: AdminService,
    private utilsService: UtilsService,
  ) { }

  /**
   * adminSignup()
   * adminLogin()
   * getLoggedInAdminData()
   * getAllAdmins()
   * getAdminById()
   * updateLoggedInAdminInfo()
   * changeLoggedInAdminPassword()
   * updateAdminById()
   * updateMultipleAdminById()
   * deleteAdminById()
   * deleteMultipleAdminById()
   */

  @Post('/signup')
  @UsePipes(ValidationPipe)
  // Guards removed: admin signup does not require a pre-existing token
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.CREATE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminAuthGuard)
  async adminSignup(
    @Body()
    createAdminDto: CreateAdminDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.adminSignup(createAdminDto);
  }

  @Post('/signup-by-admin')
  @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.CREATE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminAuthGuard)
  async adminBySignup(
    @Body()
    createAdminDto: CreateAdminDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.adminSignup(createAdminDto);
  }

  @Post('/login')
  @UsePipes(ValidationPipe)
  async adminLogin(
    @Body() authAdminDto: AuthAdminDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminAuthResponse> {
    const ua = req.headers['user-agent'] as string | undefined;
    const ip = this.utilsService.getClientIp(req);

    return await this.adminService.adminLoginWithSession(
      authAdminDto,
      { ua, ip },
      res,
    );
  }

  // ✅ NEW: 2FA verification endpoint
  @Post('/login-verify-2fa')
  @UsePipes(ValidationPipe)
  async verifyTwoFactor(
    @Body() body: VerifyTwoFactorDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminAuthResponse> {
    const ua = req.headers['user-agent'] as string | undefined;
    const ip = this.utilsService.getClientIp(req);
    return this.adminService.verifyTwoFactorAndIssue(body, { ua, ip }, res);
  }

  @Post('/refresh')
  async refreshTokens(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminAuthResponse> {
    // Try cookie first, then header
    const cookieToken = req.cookies?.admin_refresh_token;
    const headerToken =
      (req.headers['x-refresh-token'] as string) ||
      (req.headers['administrator-refresh'] as string);
    const refreshToken = cookieToken || headerToken;
    const ua = req.headers['user-agent'] as string | undefined;
    const ip = this.utilsService.getClientIp(req);

    return await this.adminService.rotateRefreshAndIssue(
      refreshToken,
      { ua, ip },
      res,
    );
  }

  // AdminController.ts
  @Post('/logout')
  @UseGuards(AdminAuthGuard)
  async logoutCurrent(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponsePayload> {
    const result = await this.adminService.revokeSessionById(
      req.user.sessionId,
      req.user._id,
      'Self logout',
    );

    // 👇 refresh + hint cookie দুটোই ক্লিয়ার
    (this.adminService as any).clearRefreshCookie(res);

    return result;
  }

  @Version(VERSION_NEUTRAL)
  @Get('/logged-in-admin-data')
  @UseGuards(AdminAuthGuard)
  async getLoggedInAdminData(
    @Query(ValidationPipe) adminSelectFieldDto: AdminSelectFieldDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.adminService.getLoggedInAdminData(
      req.user,
      adminSelectFieldDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/all-admins')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.GET)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async getAllAdmins(
    @Body() filterAdminDto: FilterAndPaginationAdminDto,
    @Query('q') searchString?: string,
  ): Promise<ResponsePayload> {
    return this.adminService.getAllAdmins(filterAdminDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.GET)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async getAdminById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query(ValidationPipe) adminSelectFieldDto: AdminSelectFieldDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.getAdminById(id, adminSelectFieldDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('affiliate/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(AffiliateAuthGuard)
  async getAdminByIdForAffiliate(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query(ValidationPipe) adminSelectFieldDto: AdminSelectFieldDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.getAdminById(id, adminSelectFieldDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-logged-in-admin')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateLoggedInAdminInfo(
    @Req() req: any,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.updateLoggedInAdminInfo(
      req.user,
      updateAdminDto,
    );
  }

  /** ✅ Policy status for FE trigger */
  @Version(VERSION_NEUTRAL)
  @Get('/password-policy-status')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  @UseGuards(AdminPermissionGuard)
  async getPasswordPolicyStatus(@Req() req: any) {
    return this.adminService.getPasswordPolicyStatus(req.user);
  }

  /** 🔁 Change password (with old password) */
  @Version(VERSION_NEUTRAL)
  @Put('/change-logged-in-admin-password')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async changeLoggedInAdminPassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.adminService.changeLoggedInAdminPassword(req.user, dto);
  }

  /** ✉️ Request reset OTP (forgot old password) */
  @Version(VERSION_NEUTRAL)
  @Post('/request-password-reset-otp')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async requestPasswordResetOtp(
    @Req() req: any,
    @Body() dto: RequestPasswordResetDto,
  ) {
    return this.adminService.requestPasswordResetForLoggedInAdmin(
      req.user,
      dto,
    );
  }

  /** ✅ Verify OTP & set new password */
  @Version(VERSION_NEUTRAL)
  @Post('/verify-password-reset')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async verifyPasswordReset(
    @Req() req: any,
    @Body() dto: VerifyPasswordResetDto,
  ) {
    return this.adminService.verifyResetAndSetNewPassword(req.user, dto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-admin/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateAdminById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.updateAdminById(id, updateAdminDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-admin-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleAdminById(
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.updateMultipleAdminById(
      updateAdminDto.ids,
      updateAdminDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-admin/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteAdminById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.adminService.deleteAdminById(id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-admin-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleAdminById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.adminService.deleteMultipleAdminById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-sessions')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleSessionAdminById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.adminService.deleteMultipleSessionAdminById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-attempts')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleAttemptsAdminById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.adminService.deleteMultipleAttemptsAdminById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleAdminByIdByVendor(
    @Body() deleteCategoryDto: DeleteCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.adminService.deleteMultipleAdminByIdByVendor(
      req.user,
      shop,
      deleteCategoryDto.ids,
    );
  }

  // ============ NEW: Session admin endpoints ============
  @Get('/sessions')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async listSessions(
    @Query('adminId') adminId?: string,
    @Query('activeOnly') activeOnly?: 'true' | 'false',
  ): Promise<ResponsePayload> {
    return this.adminService.listSessions(adminId, activeOnly === 'true');
  }

  @Get('/sessions-2')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async listSecurity(): Promise<ResponsePayload> {
    return this.adminService.listSecurity();
  }

  @Delete('/sessions/:id/revoke')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async revokeSession(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.adminService.revokeSessionById(
      id,
      req.user._id,
      'Revoked by Super Admin',
    );
  }

  @Delete('/sessions/by-admin/:adminId')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async revokeAllByAdmin(
    @Param('adminId', MongoIdValidationPipe) adminId: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.adminService.revokeAllSessionsForAdmin(
      adminId,
      req.user._id,
      'Force logout all devices',
    );
  }
}
