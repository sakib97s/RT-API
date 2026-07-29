import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

import { TiktokController } from './tiktok.controller';
import { TiktokService } from './tiktok.service';
import { SettingSchema } from '../customization/setting/schema/setting.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'Setting', schema: SettingSchema }]),
  ],
  controllers: [TiktokController],
  providers: [TiktokService],
})
export class TiktokModule {}
