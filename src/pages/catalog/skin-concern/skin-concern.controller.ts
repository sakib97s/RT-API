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
import { SkinConcernService } from './skin-concern.service';
import {
  AddSkinConcernDto,
  DeleteSkinConcernDto,
  FilterAndPaginationSkinConcernDto,
  GetSkinConcernByIdsDto,
  UpdateSkinConcernDto,
} from './dto/skin-concern.dto';
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

@Controller('skin-concern')
export class SkinConcernController {
  private logger = new Logger(SkinConcernController.name);

  constructor(private skinConcernService: SkinConcernService) {}

  /**
   * Public Api
   * getAllSkinConcernByShop()
   * getSkinConcernBySlug()
   * getSkinConcernByIds()
   */

  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllSkinConcernForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.getAllSkinConcernForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllSkinConcernByShop(
    @Body() filterSkinConcernDto: FilterAndPaginationSkinConcernDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.getAllSkinConcernByShop(
      shop,
      filterSkinConcernDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getSkinConcernBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.getSkinConcernBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-skinConcerns-by-ids')
  async getSkinConcernByIds(
    @Body() getSkinConcernByIdsDto: GetSkinConcernByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.getSkinConcernByIds(
      shop,
      getSkinConcernByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addSkinConcern()
   * getSkinConcernById()
   * updateSkinConcernById()
   * updateMultipleSkinConcernById()
   * deleteMultipleSkinConcernByIdByVendor()
   * deleteMultipleTrashSkinConcern()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addSkinConcern(
    @Body()
    addSkinConcernDto: AddSkinConcernDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.addSkinConcern(
      req.user,
      shop,
      addSkinConcernDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getSkinConcernById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.getSkinConcernById(
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
  async updateSkinConcernById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSkinConcernDto: UpdateSkinConcernDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.updateSkinConcernById(
      req.user,
      shop,
      id,
      updateSkinConcernDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleSkinConcernById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSkinConcernDto: UpdateSkinConcernDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.updateMultipleSkinConcernById(
      req.user,
      shop,
      updateSkinConcernDto.ids,
      updateSkinConcernDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleSkinConcernByIdByVendor(
    @Body() deleteSkinConcernDto: DeleteSkinConcernDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.deleteMultipleSkinConcernByIdByVendor(
      req.user,
      shop,
      deleteSkinConcernDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashSkinConcern(
    @Body() deleteSkinConcernDto: DeleteSkinConcernDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.deleteMultipleTrashSkinConcern(
      req.user,
      shop,
      deleteSkinConcernDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllSkinConcerns()
   * deleteMultipleSkinConcernById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllSkinConcerns(
    @Body() filterSkinConcernDto: FilterAndPaginationSkinConcernDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.skinConcernService.getAllSkinConcerns(
      filterSkinConcernDto,
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
  async deleteMultipleSkinConcernById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.deleteMultipleSkinConcernById(
      data.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.skinConcernService.deleteAllTrashByShop(shop);
  }
}
