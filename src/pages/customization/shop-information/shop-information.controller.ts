import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MongoIdValidationPipe } from '../../../pipes/mongo-id-validation.pipe';
import { ShopInformationService } from './shop-information.service';
import { AddShopInformationDto } from './dto/shop-information.dto';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { VendorAuthGuard } from '../../vendor/guards/vendor-auth.guard';

@Controller('shop-information')
export class ShopInformationController {
  private logger = new Logger(ShopInformationController.name);

  constructor(private shopInformationService: ShopInformationService) {}

  /**
   * Public Api
   * getShopInformation()
   */

  @Version(VERSION_NEUTRAL)
  @Get('/get')
  async getShopInformation(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopInformationService.getShopInformation(shop, select);
  }

  /**
   * Vendor Secure Api
   * addShopInformation()
   * updateShopInformation()
   */
  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addShopInformation(
    @Body()
    addShopInformationDto: AddShopInformationDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.shopInformationService.addShopInformation(
      req.user,
      shop,
      addShopInformationDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put(['/update', '/update/:id'])
  @UseGuards(VendorAuthGuard)
  async updateShopInformation(
    @Body()
    addShopInformationDto: AddShopInformationDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.shopInformationService.addShopInformation(
      req.user,
      shop,
      addShopInformationDto,
    );
  }
}
