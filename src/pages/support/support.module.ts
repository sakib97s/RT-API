import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SupportSchema } from './schema/support.schema';
import { ShopSchema } from '../shop/schema/shop.schema';
import { VendorSchema } from "../vendor/schema/vendor.schema";

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Support', schema: SupportSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Vendor', schema: VendorSchema },
    ]),
  ],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
