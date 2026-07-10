import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SkinConcernSchema } from './schema/skin-concern.schema';
import { SkinConcernService } from './skin-concern.service';
import { SkinConcernController } from './skin-concern.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';
import { ProductSchema } from '../../product/schema/product.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'SkinConcern', schema: SkinConcernSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [SkinConcernService],
  controllers: [SkinConcernController],
})
export class SkinConcernModule {}
