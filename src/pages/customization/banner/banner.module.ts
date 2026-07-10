import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BannerSchema } from './schema/banner.schema';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Banner', schema: BannerSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [BannerService],
  controllers: [BannerController],
})
export class BannerModule {}
