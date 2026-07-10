import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ProductSchema } from './schema/product.schema';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CategorySchema } from '../catalog/category/schema/category.schema';
import { BrandSchema } from '../catalog/brand/schema/brand.schema';
import { VendorSchema } from '../vendor/schema/vendor.schema';
import { ShopSchema } from '../shop/schema/shop.schema';
import { SettingSchema } from '../customization/setting/schema/setting.schema';
import { ShopInformationSchema } from '../customization/shop-information/schema/shop-information.schema';
import { SubCategorySchema } from '../catalog/sub-category/schema/sub-category.schema';
import { ChildCategorySchema } from '../catalog/child-category/schema/child-category.schema';
import { HttpModule } from '@nestjs/axios';
import { GallerySchema } from '../image-gallery/gallery/schema/gallery.schema';

@Module({
  imports: [
    JwtModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'SubCategory', schema: SubCategorySchema },
      { name: 'ChildCategory', schema: ChildCategorySchema },
      { name: 'Brand', schema: BrandSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Setting', schema: SettingSchema },
      { name: 'ShopInformation', schema: ShopInformationSchema },
      { name: 'Gallery', schema: GallerySchema },
    ]),
  ],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
