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
import {
  AddSubCategoryDto,
  DeleteSubCategoryDto,
  FilterAndPaginationSubCategoryDto,
  GetSubCategoryByIdsDto,
  UpdateSubCategoryDto,
} from './dto/sub-category.dto';
import { SubCategoryService } from './sub-category.service';

@Controller('sub-category')
export class SubCategoryController {
  private logger = new Logger(SubCategoryController.name);

  constructor(private subCategoryService: SubCategoryService) {}

  /**
   * Public Api
   * getAllSubCategoryByShop()
   * getSubCategoryBySlug()
   * getSubCategoryByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllSubCategoryByShop(
    @Body() filterSubCategoryDto: FilterAndPaginationSubCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.getAllSubCategoryByShop(
      shop,
      filterSubCategoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-by-parent/:id')
  async getSubCategoriesByCategoryId(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.getSubCategoriesByCategoryId(
      shop,
      id,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getSubCategoryBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.getSubCategoryBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-subCategorys-by-ids')
  async getSubCategoryByIds(
    @Body() getSubCategoryByIdsDto: GetSubCategoryByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.getSubCategoryByIds(
      shop,
      getSubCategoryByIdsDto,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-subcategories-group-by-category')
  @UsePipes(ValidationPipe)
  async getSubCategoriesGroupByCategory(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return this.subCategoryService.getSubCategoriesGroupByCategory(shop);
  }

  /**
   * Vendor Secure Api
   * addSubCategory()
   * getSubCategoryById()
   * updateSubCategoryById()
   * updateMultipleSubCategoryById()
   * deleteMultipleSubCategoryByIdByVendor()
   * deleteMultipleTrashSubCategory()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addSubCategory(
    @Body()
    addSubCategoryDto: AddSubCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.addSubCategory(
      req.user,
      shop,
      addSubCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getSubCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.getSubCategoryById(
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
  async updateSubCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.updateSubCategoryById(
      req.user,
      shop,
      id,
      updateSubCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleSubCategoryById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.updateMultipleSubCategoryById(
      req.user,
      shop,
      updateSubCategoryDto.ids,
      updateSubCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleSubCategoryByIdByVendor(
    @Body() deleteSubCategoryDto: DeleteSubCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.deleteMultipleSubCategoryByIdByVendor(
      req.user,
      shop,
      deleteSubCategoryDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashSubCategory(
    @Body() deleteSubCategoryDto: DeleteSubCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.deleteMultipleTrashSubCategory(
      req.user,
      shop,
      deleteSubCategoryDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllSubCategorys()
   * deleteMultipleSubCategoryById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllSubCategorys(
    @Body() filterSubCategoryDto: FilterAndPaginationSubCategoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.subCategoryService.getAllSubCategorys(
      filterSubCategoryDto,
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
  async deleteMultipleSubCategoryById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.subCategoryService.deleteMultipleSubCategoryById(
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
    return await this.subCategoryService.deleteAllTrashByShop(shop);
  }
}
