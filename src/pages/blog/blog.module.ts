import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BlogSchema } from './schema/blog.schema';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Blog', schema: BlogSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
