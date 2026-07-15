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
import { IS_PUBLIC_KEY } from 'src/decorator/public-access.decorator';

@Injectable()
export class VendorAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const vendorToken = this.extractTokenFromHeader(request);
    const adminToken = this.extractAdminTokenFromHeader(request);

    if (vendorToken) {
      try {
        const jwtSecret = this.configService.get<string>('vendorJwtSecret');
        const payload = await this.jwtService.verifyAsync(vendorToken, {
          secret: jwtSecret,
        });
        request['user'] = payload;
        return true;
      } catch {
        // Fall through
      }
    }

    if (adminToken) {
      try {
        const jwtSecret = this.configService.get<string>('adminJwtSecret');
        const payload = await this.jwtService.verifyAsync(adminToken, {
          secret: jwtSecret,
        });
        request['user'] = payload;
        return true;
      } catch {
        // Fall through
      }
    }

    throw new UnauthorizedException();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    return (request.headers['vendor'] as string) ?? null;
  }

  private extractAdminTokenFromHeader(request: Request): string | undefined {
    const legacy = (request.headers['administrator'] as string) ?? null;
    if (legacy) return legacy;
    const auth = request.headers.authorization;
    if (!auth) return undefined;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
