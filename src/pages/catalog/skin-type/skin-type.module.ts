import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SkinTypeSchema } from './schema/skin-type.schema';
import { SkinTypeService } from './skin-type.service';
import { SkinTypeController } from './skin-type.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';
import { ProductSchema } from '../../product/schema/product.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'SkinType', schema: SkinTypeSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [SkinTypeService],
  controllers: [SkinTypeController],
})
export class SkinTypeModule {}
