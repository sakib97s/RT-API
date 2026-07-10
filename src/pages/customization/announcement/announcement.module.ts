import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnouncementSchema } from './schema/announcement.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: 'Announcement', schema: AnnouncementSchema }]),
  ],
  providers: [AnnouncementService],
  controllers: [AnnouncementController],
})
export class AnnouncementModule {
}
