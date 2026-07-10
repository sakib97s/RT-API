import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistSchema } from './schema/wishlist.schema';
import { JwtModule } from '@nestjs/jwt';
import { UserSchema } from '../user/schema/user.schema';
import { ProductSchema } from '../product/schema/product.schema';
import { ShopSchema } from '../shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Wishlist', schema: WishlistSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [WishlistService],
  controllers: [WishlistController],
})
export class WishlistModule {}
