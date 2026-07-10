import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { ShopService } from './shop.service';
import { Response } from 'express';
import {
  AddShopDto,
  AddVendorAndShopDto,
  ChangeDomainDto,
  ChangeThemeDto,
  CloneDataFromShopDto,
  DeleteShopDto,
  FilterAndPaginationShopDto,
  InsertManyShopDto,
  UpdateShopDto,
} from './dto/shop.dto';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';
import * as fs from 'fs';

@Controller('shop')
export class ShopController {
  private logger = new Logger(ShopController.name);

  constructor(private shopService: ShopService) { }

  /**
   * Public/Vendor Routes
   * No admin dependencies
   */

  @Version(VERSION_NEUTRAL)
  @Post('/change-domain-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async changeDomainByVendor(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() changeDomainDto: ChangeDomainDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.shopService.changeDomainByVendor(
      req.user,
      shop,
      changeDomainDto,
    );
  }

  @Post('/create-vendor-and-shop')
  @UsePipes(ValidationPipe)
  async createVendorAndShop(
    @Body()
    addVendorAndShopDto: AddVendorAndShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.createVendorAndShop(
      addVendorAndShopDto,
    );
  }

  @Post('/delete-shop')
  @UsePipes(ValidationPipe)
  async deleteShop(
    @Body()
    deleteShopDto: DeleteShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.deleteShop(deleteShopDto);
  }

  @Post('/delete-shop-2-sazib')
  @UsePipes(ValidationPipe)
  async deleteMultiShop(
    @Body()
    deleteShopDto: DeleteShopDto[],
    @Query('key') key: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.deleteMultiShop(key, deleteShopDto);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/update-build-status/:id')
  @UsePipes(ValidationPipe)
  async updateShopBuildStatusById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.updateShopBuildStatusById(id, updateShopDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/download-data')
  @UsePipes(ValidationPipe)
  @UsePipes(ValidationPipe)





  async downloadShopData(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Res() res: Response,
  ) {
    const filePath = await this.shopService.exportShopData(shop);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shop-${shop}.zip"`,
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/check-build-status-by-shop')
  @UsePipes(ValidationPipe)
  async checkShopBuildStatusByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.checkShopBuildStatusById(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/check-build-status/:id')
  @UsePipes(ValidationPipe)
  async checkShopBuildStatusById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.checkShopBuildStatusById(id);
  }

  @Put('/version-update/:id')
  @UsePipes(ValidationPipe)





  async updateWebsite(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.versionUpdateByShop(id);
  }

  @Post('/shops-version-update-by-theme/:id')
  @UsePipes(ValidationPipe)





  async shopsVersionUpdateByTheme(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.shopsVersionUpdateByTheme(id);
  }

  @Put('/change-theme-by-shop/:id')
  @UsePipes(ValidationPipe)





  async changeThemeByShop(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body()
    changeThemeDto: ChangeThemeDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.changeThemeByShop(id, changeThemeDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)





  async insertManyShop(
    @Body()
    body: InsertManyShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.insertManyShop(body.data, body.option);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllShop(
    @Body() filterShopDto: FilterAndPaginationShopDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.shopService.getAllShop(filterShopDto, searchString);
  }

  // @Version(VERSION_NEUTRAL)
  // @Get('/get-all-basic')
  // async getAllShopBasic(): Promise<ResponsePayload> {
  //   return await this.shopService.getAllShopBasic();
  // }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by/:id')
  async getShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getShopById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-shop-info-by/:id')
  async getShopInfoById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getShopInfoById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-setting-by-shop/:id')
  async getSettingByShop(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getSettingByShop(id);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-page/:pageName')
  @UsePipes(ValidationPipe)
  async getShopPageByPage(
    @Param('pageName') pageName: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.shopService.getShopPageByPage(pageName, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)





  async updateShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.updateShopById(id, updateShopDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-shop-vendor-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async updateShopByVendorById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.updateShopById(id, updateShopDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-shop-dashboard-statement')
  @UsePipes(ValidationPipe)





  async getShopDashboardStats(): Promise<ResponsePayload> {
    return await this.shopService.getShopDashboardStats();
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)





  async updateMultipleShopById(
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.updateMultipleShopById(
      updateShopDto.ids,
      updateShopDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/renew-multiple')
  @UsePipes(ValidationPipe)





  async renewMultipleShop(
    @Body() updateShopDto: any,
  ): Promise<ResponsePayload> {
    return await this.shopService.renewMultipleShop(
      updateShopDto.ids,
      updateShopDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete/:id')
  @UsePipes(ValidationPipe)





  async deleteShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.shopService.deleteShopById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)





  async deleteMultipleShopById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.shopService.deleteMultipleShopById(
      data.ids,
      Boolean(checkUsage),
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-shop-category')
  async getShopCategory(): Promise<ResponsePayload> {
    return await this.shopService.getShopCategory();
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-shop-sub-category')
  async getShopSubCategory(): Promise<ResponsePayload> {
    return await this.shopService.getShopSubCategory();
  }

  @Post('/clone-data-from-shop')
  async cloneDataFromShop(
    @Body()
    cloneDataFromShopDto: CloneDataFromShopDto,
  ): Promise<ResponsePayload> {
    return await this.shopService.cloneDataFromShop(cloneDataFromShopDto);
  }

  @Post('/replace-all-url')
  async replaceUrl(
    @Body() body: { fromUrl: string; toUrl: string },
  ): Promise<{ message: string }> {
    const { fromUrl, toUrl } = body;
    await this.shopService.replaceUrlInAllCollections(fromUrl, toUrl);
    return { message: 'All URLs replaced successfully' };
  }
}
