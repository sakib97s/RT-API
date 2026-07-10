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
import { CategoryService } from './category.service';
import {
  AddCategoryDto,
  DeleteCategoryDto,
  FilterAndPaginationCategoryDto,
  GetCategoryByIdsDto,
  UpdateCategoryDto,
} from './dto/category.dto';
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

@Controller('category')
export class CategoryController {
  private logger = new Logger(CategoryController.name);

  constructor(private categoryService: CategoryService) {}

  /**
   * Public Api
   * getAllCategoryForUi()
   * getAllCategoryByShop()
   * getCategoryBySlug()
   * getCategoryByIds()
   */
  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllCategoryForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.categoryService.getAllCategoryForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllCategoryByShop(
    @Body() filterCategoryDto: FilterAndPaginationCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.categoryService.getAllCategoryByShop(
      shop,
      filterCategoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getCategoryBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.categoryService.getCategoryBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-categorys-by-ids')
  async getCategoryByIds(
    @Body() getCategoryByIdsDto: GetCategoryByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.categoryService.getCategoryByIds(
      shop,
      getCategoryByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addCategory()
   * getCategoryById()
   * updateCategoryById()
   * updateMultipleCategoryById()
   * deleteMultipleCategoryByIdByVendor()
   * deleteMultipleTrashCategory()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addCategory(
    @Body()
    addCategoryDto: AddCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.categoryService.addCategory(
      req.user,
      shop,
      addCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.categoryService.getCategoryById(
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
  async updateCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.categoryService.updateCategoryById(
      req.user,
      shop,
      id,
      updateCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleCategoryById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.categoryService.updateMultipleCategoryById(
      req.user,
      shop,
      updateCategoryDto.ids,
      updateCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleCategoryByIdByVendor(
    @Body() deleteCategoryDto: DeleteCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.categoryService.deleteMultipleCategoryByIdByVendor(
      req.user,
      shop,
      deleteCategoryDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashCategory(
    @Body() deleteCategoryDto: DeleteCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.categoryService.deleteMultipleTrashCategory(
      req.user,
      shop,
      deleteCategoryDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllCategorys()
   * deleteMultipleCategoryById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllCategorys(
    @Body() filterCategoryDto: FilterAndPaginationCategoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.categoryService.getAllCategorys(
      filterCategoryDto,
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
  async deleteMultipleCategoryById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.categoryService.deleteMultipleCategoryById(data.ids);
  }


  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.categoryService.deleteAllTrashByShop(shop);
  }
}
