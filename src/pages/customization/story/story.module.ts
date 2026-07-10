import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { StorySchema } from './schema/story.schema';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';


@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Story', schema: StorySchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [StoryService],
  controllers: [StoryController],
})
export class StoryModule {}
