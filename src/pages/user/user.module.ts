import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { OtpService } from '../otp/otp.service';
import { OtpSchema } from '../otp/schema/otp.schema';
import { ShopSchema } from '../shop/schema/shop.schema';
import { SettingSchema } from '../customization/setting/schema/setting.schema';
import { OtpAdminSchema } from '../otp/schema/otp-admin.schema';
import { ShopInformationSchema } from '../customization/shop-information/schema/shop-information.schema';
import { IpBlockModule } from '../ip-block/ip-block.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Otp', schema: OtpSchema },
      { name: 'OtpAdmin', schema: OtpAdminSchema },
      { name: 'Setting', schema: SettingSchema },
      { name: 'ShopInformation', schema: ShopInformationSchema },
    ]),
    IpBlockModule,
  ],
  controllers: [UserController],
  providers: [UserService, OtpService],
  exports: [],
})
export class UserModule {}
