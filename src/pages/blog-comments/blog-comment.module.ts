import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BlogCommentSchema } from './schema/blog-comment.schema';
import { BlogCommentService } from './blog-comment.service';
import { BlogCommentController } from './blog-comment.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';
import { BlogSchema } from '../blog/schema/blog.schema';
import { UserSchema } from '../user/schema/user.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'BlogComment', schema: BlogCommentSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Blog', schema: BlogSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  providers: [BlogCommentService],
  controllers: [BlogCommentController],
})
export class BlogCommentModule {}
