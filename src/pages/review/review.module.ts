import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewSchema } from './schema/review.schema';
import { JwtModule } from '@nestjs/jwt';
import { UserSchema } from '../user/schema/user.schema';
import { OrderSchema } from '../order/schema/order.schema';
import { ProductSchema } from '../product/schema/product.schema';
import {VendorSchema} from '../vendor/schema/vendor.schema';
import { ShopSchema } from '../shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Review', schema: ReviewSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
