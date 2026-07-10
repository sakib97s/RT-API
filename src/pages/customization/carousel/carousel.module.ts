import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { CarouselSchema } from './schema/carousel.schema';
import { CarouselService } from './carousel.service';
import { CarouselController } from './carousel.controller';
import { VendorSchema } from 'src/pages/vendor/schema/vendor.schema';
import { ShopSchema } from 'src/pages/shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Carousel', schema: CarouselSchema },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [CarouselService],
  controllers: [CarouselController],
})
export class CarouselModule {}
