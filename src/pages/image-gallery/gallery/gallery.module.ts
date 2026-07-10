import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GallerySchema } from './schema/gallery.schema';
import { JwtModule } from '@nestjs/jwt';
import { GalleryService } from './gallery.service';
import { ShopSchema } from '../../shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Gallery', schema: GallerySchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [GalleryService],
  controllers: [GalleryController],
})
export class GalleryModule {}
