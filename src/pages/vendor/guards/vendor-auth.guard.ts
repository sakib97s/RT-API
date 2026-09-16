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
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

@Injectable()
export class VendorAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @InjectConnection() private readonly conn: Connection,
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

        const vendorUser: any = {
          ...payload,
          adminId: payload._id,
          isAdmin: true,
          role: payload.role || 'super_admin',
        };

        const shopId =
          request.query?.shop || request.body?.shop || request.params?.shop || '6a4027ff8f92d99c83aa6e87';

        if (
          shopId &&
          Types.ObjectId.isValid(shopId) &&
          payload._id &&
          Types.ObjectId.isValid(payload._id)
        ) {
          try {
            const shopObjectId = new Types.ObjectId(shopId);
            const adminObjectId = new Types.ObjectId(payload._id);
            const existingShop = await this.conn.collection('shops').findOne({ _id: shopObjectId });
            if (!existingShop) {
              await this.conn.collection('shops').insertOne({
                _id: shopObjectId,
                websiteName: 'Rome Empire Tours',
                domain: 'romeempiretours.com',
                affiliateAccess: true,
                isTrailPrice: false,
                theme: { images: [] },
                dateString: new Date().toISOString().split('T')[0],
                owner: adminObjectId,
                users: [
                  {
                    _id: adminObjectId,
                    role: payload.role || 'admin',
                    username: payload.username || 'admin',
                    email: payload.email || `${payload.username || 'admin'}@romeempiretours.com`,
                  },
                ],
                buildStatus: 'complete',
                registeredBy: 'self',
                trialPeriod: 0,
                paymentStatus: 'custom',
                status: 'publish',
                startDate: new Date().toISOString().split('T')[0],
                minWithdrawAmount: 0,
                clientNotes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            } else {
              await this.conn.collection('shops').updateOne(
                { _id: shopObjectId, 'users._id': { $ne: adminObjectId } },
                {
                  $push: {
                    users: {
                      _id: adminObjectId,
                      role: payload.role || 'admin',
                      username: payload.username || 'admin',
                      email: payload.email || '',
                    },
                  },
                } as any,
              );
            }
          } catch {
            // Ignore
          }
        }

        request['user'] = vendorUser;
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
