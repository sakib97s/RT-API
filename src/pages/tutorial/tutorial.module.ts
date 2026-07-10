import { Module } from '@nestjs/common';
import { TutorialService } from './tutorial.service';
import { TutorialController } from './tutorial.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { TutorialSchema } from './schema/tutorial.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: 'Tutorial', schema: TutorialSchema }]),
  ],
  providers: [TutorialService],
  controllers: [TutorialController],
})
export class TutorialModule {}
