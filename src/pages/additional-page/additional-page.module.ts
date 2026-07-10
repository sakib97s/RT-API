import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AdditionalPageSchema } from './schema/additional-page.schema';
import { AdditionalPageService } from './additional-page.service';
import { AdditionalPageController } from './additional-page.controller';
import { CategorySchema } from '../catalog/category/schema/category.schema';
import { BrandSchema } from '../catalog/brand/schema/brand.schema';
import { VendorSchema } from '../vendor/schema/vendor.schema';
import { ShopSchema } from "../shop/schema/shop.schema";

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'AdditionalPage', schema: AdditionalPageSchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'Brand', schema: BrandSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [AdditionalPageService],
  controllers: [AdditionalPageController],
})
export class AdditionalPageModule {}
