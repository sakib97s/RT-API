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
import { BrandService } from './brand.service';
import {
  AddBrandDto,
  DeleteBrandDto,
  FilterAndPaginationBrandDto,
  GetBrandByIdsDto,
  UpdateBrandDto,
} from './dto/brand.dto';
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

@Controller('brand')
export class BrandController {
  private logger = new Logger(BrandController.name);

  constructor(private brandService: BrandService) {}

  /**
   * Public Api
   * getAllBrandByShop()
   * getBrandBySlug()
   * getBrandByIds()
   */

  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllBrandForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.brandService.getAllBrandForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllBrandByShop(
    @Body() filterBrandDto: FilterAndPaginationBrandDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.brandService.getAllBrandByShop(
      shop,
      filterBrandDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getBrandBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.brandService.getBrandBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-brands-by-ids')
  async getBrandByIds(
    @Body() getBrandByIdsDto: GetBrandByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.brandService.getBrandByIds(
      shop,
      getBrandByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addBrand()
   * getBrandById()
   * updateBrandById()
   * updateMultipleBrandById()
   * deleteMultipleBrandByIdByVendor()
   * deleteMultipleTrashBrand()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addBrand(
    @Body()
    addBrandDto: AddBrandDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.brandService.addBrand(req.user, shop, addBrandDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getBrandById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.brandService.getBrandById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateBrandById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.brandService.updateBrandById(
      req.user,
      shop,
      id,
      updateBrandDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleBrandById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.brandService.updateMultipleBrandById(
      req.user,
      shop,
      updateBrandDto.ids,
      updateBrandDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleBrandByIdByVendor(
    @Body() deleteBrandDto: DeleteBrandDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.brandService.deleteMultipleBrandByIdByVendor(
      req.user,
      shop,
      deleteBrandDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashBrand(
    @Body() deleteBrandDto: DeleteBrandDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.brandService.deleteMultipleTrashBrand(
      req.user,
      shop,
      deleteBrandDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllBrands()
   * deleteMultipleBrandById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  // @UseGuards(AdminRolesGuard)
  // @UseGuards(AdminAuthGuard)
  async getAllBrands(
    @Body() filterBrandDto: FilterAndPaginationBrandDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.brandService.getAllBrands(filterBrandDto, searchString);
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
  async deleteMultipleBrandById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.brandService.deleteMultipleBrandById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.brandService.deleteAllTrashByShop(shop);
  }
}
