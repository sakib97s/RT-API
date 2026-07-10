import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSchema } from './schema/admin.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminSessionSchema } from './schema/admin-session.schema';
import { AdminSecuritySchema } from './schema/admin-security.schema';
import { ShopSchema } from '../shop/schema/shop.schema';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Admin', schema: AdminSchema },
      { name: 'AdminSession', schema: AdminSessionSchema },
      { name: 'AdminSecurity', schema: AdminSecuritySchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [],
})
export class AdminModule {}
