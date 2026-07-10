import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import {
  AddBannerDto,
  DeleteBannerDto,
  FilterAndPaginationBannerDto,
  GetBannerByIdsDto,
  UpdateBannerDto,
} from './dto/banner.dto';
import { AdminMetaRoles } from 'src/pages/admin/decorator/admin-roles.decorator';
import { AdminRoles } from 'src/enum/admin-roles.enum';
import { AdminRolesGuard } from 'src/pages/admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/pages/admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from 'src/enum/admin-permission.enum';
import { AdminPermissionGuard } from 'src/pages/admin/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { VendorAuthGuard } from 'src/pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';

@Controller('banner')
export class BannerController {
  private logger = new Logger(BannerController.name);

  constructor(private bannerService: BannerService) {}

  /**
   * Public Api
   * getAllBannerByShop()
   * getBannerBySlug()
   * getBannerByIds()
   */

  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllBannerForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.bannerService.getAllBannerForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllBannerByShop(
    @Body() filterBannerDto: FilterAndPaginationBannerDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.bannerService.getAllBannerByShop(
      shop,
      filterBannerDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getBannerBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.bannerService.getBannerBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-banners-by-ids')
  async getBannerByIds(
    @Body() getBannerByIdsDto: GetBannerByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.bannerService.getBannerByIds(
      shop,
      getBannerByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addBanner()
   * getBannerById()
   * updateBannerById()
   * updateMultipleBannerById()
   * deleteMultipleBannerByIdByVendor()
   * deleteMultipleTrashBanner()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addBanner(
    @Body()
    addBannerDto: AddBannerDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.bannerService.addBanner(req.user, shop, addBannerDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getBannerById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.bannerService.getBannerById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateBannerById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.bannerService.updateBannerById(
      req.user,
      shop,
      id,
      updateBannerDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleBannerById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.bannerService.updateMultipleBannerById(
      req.user,
      shop,
      updateBannerDto.ids,
      updateBannerDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleBannerByIdByVendor(
    @Body() deleteBannerDto: DeleteBannerDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.bannerService.deleteMultipleBannerByIdByVendor(
      req.user,
      shop,
      deleteBannerDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashBanner(
    @Body() deleteBannerDto: DeleteBannerDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.bannerService.deleteMultipleTrashBanner(
      req.user,
      shop,
      deleteBannerDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllBanners()
   * deleteMultipleBannerById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllBanners(
    @Body() filterBannerDto: FilterAndPaginationBannerDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.bannerService.getAllBanners(filterBannerDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-by-admin')
  @UsePipes(ValidationPipe)
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleBannerById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.bannerService.deleteMultipleBannerById(data.ids);
  }


  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.bannerService.deleteAllTrashByShop(shop);
  }
}
