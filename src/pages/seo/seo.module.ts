import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SeoSchema } from './schema/seo.schema';
import { SeoService } from './seo.service';
import { SeoController } from './seo.controller';
import { CategorySchema } from '../catalog/category/schema/category.schema';
import { BrandSchema } from '../catalog/brand/schema/brand.schema';
import { VendorSchema } from '../vendor/schema/vendor.schema';
import { ShopSchema } from "../shop/schema/shop.schema";

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Seo', schema: SeoSchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'Brand', schema: BrandSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [SeoService],
  controllers: [SeoController],
})
export class SeoModule {}
