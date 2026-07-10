import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ChildCategorySchema } from './schema/child-category.schema';
import { ChildCategoryService } from './child-category.service';
import { ChildCategoryController } from './child-category.controller';
import { BrandSchema } from '../brand/schema/brand.schema';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';
import { SubCategorySchema } from '../sub-category/schema/sub-category.schema';
import { ProductSchema } from '../../product/schema/product.schema';
import { CategorySchema } from '../category/schema/category.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'ChildCategory', schema: ChildCategorySchema },
      { name: 'SubCategory', schema: SubCategorySchema },
      { name: 'Brand', schema: BrandSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Category', schema: CategorySchema },
    ]),
  ],
  providers: [ChildCategoryService],
  controllers: [ChildCategoryController],
})
export class ChildCategoryModule {}
