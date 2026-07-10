import { Module } from '@nestjs/common';
import { FileFolderController } from './file-folder.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FileFolderSchema } from './schema/file-folder.schema';
import { JwtModule } from '@nestjs/jwt';
import { FileFolderService } from './file-folder.service';
import { ShopSchema } from '../../shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'FileFolder', schema: FileFolderSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [FileFolderService],
  controllers: [FileFolderController],
})
export class FileFolderModule {}
