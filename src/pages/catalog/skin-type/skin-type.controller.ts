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
import { SkinTypeService } from './skin-type.service';
import {
  AddSkinTypeDto,
  DeleteSkinTypeDto,
  FilterAndPaginationSkinTypeDto,
  GetSkinTypeByIdsDto,
  UpdateSkinTypeDto,
} from './dto/skin-type.dto';
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

@Controller('skin-type')
export class SkinTypeController {
  private logger = new Logger(SkinTypeController.name);

  constructor(private skinTypeService: SkinTypeService) {}

  /**
   * Public Api
   * getAllSkinTypeByShop()
   * getSkinTypeBySlug()
   * getSkinTypeByIds()
   */

  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllSkinTypeForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.getAllSkinTypeForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllSkinTypeByShop(
    @Body() filterSkinTypeDto: FilterAndPaginationSkinTypeDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.getAllSkinTypeByShop(
      shop,
      filterSkinTypeDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getSkinTypeBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.getSkinTypeBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-skinTypes-by-ids')
  async getSkinTypeByIds(
    @Body() getSkinTypeByIdsDto: GetSkinTypeByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.getSkinTypeByIds(
      shop,
      getSkinTypeByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addSkinType()
   * getSkinTypeById()
   * updateSkinTypeById()
   * updateMultipleSkinTypeById()
   * deleteMultipleSkinTypeByIdByVendor()
   * deleteMultipleTrashSkinType()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addSkinType(
    @Body()
    addSkinTypeDto: AddSkinTypeDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.addSkinType(
      req.user,
      shop,
      addSkinTypeDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getSkinTypeById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.getSkinTypeById(
      req.user,
      shop,
      id,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateSkinTypeById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSkinTypeDto: UpdateSkinTypeDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.updateSkinTypeById(
      req.user,
      shop,
      id,
      updateSkinTypeDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleSkinTypeById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSkinTypeDto: UpdateSkinTypeDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.updateMultipleSkinTypeById(
      req.user,
      shop,
      updateSkinTypeDto.ids,
      updateSkinTypeDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleSkinTypeByIdByVendor(
    @Body() deleteSkinTypeDto: DeleteSkinTypeDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.deleteMultipleSkinTypeByIdByVendor(
      req.user,
      shop,
      deleteSkinTypeDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashSkinType(
    @Body() deleteSkinTypeDto: DeleteSkinTypeDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.deleteMultipleTrashSkinType(
      req.user,
      shop,
      deleteSkinTypeDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllSkinTypes()
   * deleteMultipleSkinTypeById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllSkinTypes(
    @Body() filterSkinTypeDto: FilterAndPaginationSkinTypeDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.skinTypeService.getAllSkinTypes(
      filterSkinTypeDto,
      searchString,
    );
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
  async deleteMultipleSkinTypeById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.deleteMultipleSkinTypeById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.skinTypeService.deleteAllTrashByShop(shop);
  }
}
