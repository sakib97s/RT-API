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
import { SeoService } from './seo.service';
import {
  AddSeoDto,
  DeleteSeoDto,
  FilterAndPaginationSeoDto,
  GetSeoByIdsDto,
  UpdateSeoDto,
} from './dto/seo.dto';
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

@Controller('seo')
export class SeoController {
  private logger = new Logger(SeoController.name);

  constructor(private seoService: SeoService) {}

  /**
   * Public Api
   * getAllSeoByShop()
   * getSeoBySlug()
   * getSeoByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllSeoByShop(
    @Body() filterSeoDto: FilterAndPaginationSeoDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.seoService.getAllSeoByShop(
      shop,
      filterSeoDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getSeoBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.seoService.getSeoBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-seos-by-ids')
  async getSeoByIds(
    @Body() getSeoByIdsDto: GetSeoByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.seoService.getSeoByIds(shop, getSeoByIdsDto, select);
  }

  /**
   * Vendor Secure Api
   * addSeo()
   * getSeoById()
   * updateSeoById()
   * updateMultipleSeoById()
   * deleteMultipleSeoByIdByVendor()
   * deleteMultipleTrashSeo()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addSeo(
    @Body()
    addSeoDto: AddSeoDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoService.addSeo(req.user, addSeoDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getSeoById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoService.getSeoById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateSeoById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSeoDto: UpdateSeoDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoService.updateSeoById(
      req.user,
      shop,
      id,
      updateSeoDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleSeoById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSeoDto: UpdateSeoDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoService.updateMultipleSeoById(
      req.user,
      shop,
      updateSeoDto.ids,
      updateSeoDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleSeoByIdByVendor(
    @Body() deleteSeoDto: DeleteSeoDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoService.deleteMultipleSeoByIdByVendor(
      req.user,
      shop,
      deleteSeoDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashSeo(
    @Body() deleteSeoDto: DeleteSeoDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.seoService.deleteMultipleTrashSeo(
      req.user,
      shop,
      deleteSeoDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllSeos()
   * deleteMultipleSeoById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllSeos(
    @Body() filterSeoDto: FilterAndPaginationSeoDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.seoService.getAllSeos(filterSeoDto, searchString);
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
  async deleteMultipleSeoById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.seoService.deleteMultipleSeoById(data.ids);
  }
}
