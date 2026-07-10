import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { JwtModule } from '@nestjs/jwt';

import { HttpModule } from '@nestjs/axios';
import { CustomShopSchema } from './schema/custom-shop.schema';
import { CustomShopController } from './custom-shop.controller';
import { CustomShopService } from './custom-shop.service';


@Module({
  imports: [
    JwtModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: 'CustomShop', schema: CustomShopSchema },
    ]),
  ],
  providers: [CustomShopService],
  controllers: [CustomShopController],
})
export class CustomShopModule {}
