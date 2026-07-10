import { Global, Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema } from '../../pages/product/schema/product.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([

      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
