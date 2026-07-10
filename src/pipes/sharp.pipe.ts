import { Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class SharpPipe
  implements PipeTransform<Express.Multer.File, Promise<string>>
{
  async transform(image: Express.Multer.File): Promise<any> {
    const dir = `upload/images`;
    const filename = path.parse(image.filename).name;
    const newFilename = filename + '.webp';
    const newPath = `${dir}/${newFilename}`;

    const sharpObj = await sharp(image.path)
      // .resize(800)
      .webp({ effort: 4, quality: 85 })
      .toFile(path.join(dir, newFilename));

    return {
      originalname: image.originalname,
      filename: newFilename,
      path: newPath,
      oldPath: image.path,
      size: sharpObj.size,
    };
  }
}
