import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './schema/cart.schema';
import { JwtModule } from '@nestjs/jwt';
import { UserSchema } from '../user/schema/user.schema';
import { ProductSchema } from '../product/schema/product.schema';
import { ShopSchema } from '../shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Cart', schema: CartSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
