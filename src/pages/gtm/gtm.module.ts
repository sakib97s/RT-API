import { Module } from '@nestjs/common';
import { GtmService } from './gtm.service';
import { GtmController } from './gtm.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ShopSchema } from '../shop/schema/shop.schema';
import { AnalyticsModule } from '../../shared/analytics/analytics.module';
import { SettingSchema } from '../customization/setting/schema/setting.schema';

@Module({
  imports: [
    JwtModule,
    AnalyticsModule,
    MongooseModule.forFeature([
      { name: 'Shop', schema: ShopSchema },
      { name: 'Setting', schema: SettingSchema },
    ]),
  ],
  providers: [GtmService],
  controllers: [GtmController],
})
export class GtmModule {}
