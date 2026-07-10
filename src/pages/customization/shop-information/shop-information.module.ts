import { Module } from '@nestjs/common';
import { ShopInformationService } from './shop-information.service';
import { ShopInformationController } from './shop-information.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopInformationSchema } from './schema/shop-information.schema';
import { JwtModule } from '@nestjs/jwt';
import { ShopSchema } from '../../shop/schema/shop.schema';
import { IpBlockModule } from '../../ip-block/ip-block.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'ShopInformation', schema: ShopInformationSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
    IpBlockModule,
  ],
  providers: [ShopInformationService],
  controllers: [ShopInformationController],
})
export class ShopInformationModule {}
