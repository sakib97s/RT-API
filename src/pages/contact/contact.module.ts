import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { JwtModule } from '@nestjs/jwt';
import { ContactSchema } from './schema/contact.schema';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: 'Contact', schema: ContactSchema }]),
  ],
  providers: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
