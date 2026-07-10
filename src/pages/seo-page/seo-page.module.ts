import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SeoPageSchema } from './schema/seo-page.schema';
import { SeoPageService } from './seo-page.service';
import { SeoPageController } from './seo-page.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'SeoPage', schema: SeoPageSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [SeoPageService],
  controllers: [SeoPageController],
})
export class SeoPageModule {}
