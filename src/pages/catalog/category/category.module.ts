import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { CategorySchema } from './schema/category.schema';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandSchema } from '../brand/schema/brand.schema';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';
import { ProductSchema } from '../../product/schema/product.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Category', schema: CategorySchema },
      { name: 'Brand', schema: BrandSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class CategoryModule {}
