import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SubCategorySchema } from './schema/sub-category.schema';
import { SubCategoryService } from './sub-category.service';
import { SubCategoryController } from './sub-category.controller';
import { BrandSchema } from '../brand/schema/brand.schema';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';
import { ProductSchema } from '../../product/schema/product.schema';
import { CategorySchema } from '../category/schema/category.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'SubCategory', schema: SubCategorySchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'Brand', schema: BrandSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [SubCategoryService],
  controllers: [SubCategoryController],
})
export class SubCategoryModule {}
