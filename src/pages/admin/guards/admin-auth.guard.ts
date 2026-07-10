// src/pages/admin/guards/admin-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public-access.decorator';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

interface AccessPayload {
  _id: string;
  username: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private sessionModel: Model<any>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @InjectConnection() private readonly conn: Connection, // ✅ connection inject
  ) {
    // ✅ model dynamically resolve (once)
    this.sessionModel = this.conn.model('AdminSession');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractAccessToken(request);
    if (!token) throw new UnauthorizedException('No access token');

    try {
      const jwtSecret = this.configService.get<string>('adminJwtSecret');
      const payload = await this.jwtService.verifyAsync<AccessPayload>(token, {
        secret: jwtSecret,
      });

      if (!payload?.sessionId)
        throw new UnauthorizedException('Invalid session');

      // ✅ session lookup without provider injection
      const session: any = await this.sessionModel
        .findById(payload.sessionId)
        .lean();
      if (!session) throw new UnauthorizedException('Session not found');
      if (session.revokedAt) throw new UnauthorizedException('Session revoked');
      if (new Date(session.expiresAt) <= new Date())
        throw new UnauthorizedException('Session expired');

      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractAccessToken(request: Request): string | undefined {
    const legacy = (request.headers['administrator'] as string) ?? null;
    if (legacy) return legacy;
    const auth = request.headers.authorization;
    if (!auth) return undefined;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
