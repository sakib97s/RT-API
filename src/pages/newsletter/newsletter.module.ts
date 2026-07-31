import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsletterSchema } from '../../schema/newsletter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Newsletter', schema: NewsletterSchema },
    ]),
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
