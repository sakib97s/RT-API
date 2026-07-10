import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { TagSchema } from './schema/tag.schema';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { BrandSchema } from '../brand/schema/brand.schema';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';
import { ProductSchema } from '../../product/schema/product.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Tag', schema: TagSchema },
      { name: 'Brand', schema: BrandSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [TagService],
  controllers: [TagController],
})
export class TagModule {}
