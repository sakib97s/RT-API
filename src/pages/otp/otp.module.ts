import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpSchema } from './schema/otp.schema';
import { BulkSmsModule } from '../../shared/bulk-sms/bulk-sms.module';
import { SettingSchema } from '../customization/setting/schema/setting.schema';
import { ShopSchema } from '../shop/schema/shop.schema';
import { OtpAdminSchema } from './schema/otp-admin.schema';
import { ShopInformationSchema } from '../customization/shop-information/schema/shop-information.schema';
import { IpBlockSchema } from '../ip-block/schema/ip-block.schema';
import { IpBlockModule } from '../ip-block/ip-block.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'OtpAdmin', schema: OtpAdminSchema },
      { name: 'Otp', schema: OtpSchema },
      { name: 'Setting', schema: SettingSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'ShopInformation', schema: ShopInformationSchema },

    ]),
    BulkSmsModule,
    IpBlockModule,
  ],
  providers: [OtpService],
  controllers: [OtpController],
})
export class OtpModule {}
