import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { WebsiteReviewSchema } from './schema/website-review.schema';
import { WebsiteReviewService } from './website-review.service';
import { WebsiteReviewController } from './website-review.controller';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'WebsiteReview', schema: WebsiteReviewSchema },
    ]),
  ],
  providers: [WebsiteReviewService],
  controllers: [WebsiteReviewController],
})
export class WebsiteReviewModule {}
