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
import { ExpenseCategoryService } from './expense-category.service';
import {
  AddExpenseCategoryDto,
  DeleteExpenseCategoryDto,
  FilterAndPaginationExpenseCategoryDto,
  GetExpenseCategoryByIdsDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
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

@Controller('expense-category')
export class ExpenseCategoryController {
  private logger = new Logger(ExpenseCategoryController.name);

  constructor(private expenseCategoryService: ExpenseCategoryService) {}

  /**
   * Public Api
   * getAllExpenseCategoryByShop()
   * getExpenseCategoryBySlug()
   * getExpenseCategoryByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllExpenseCategoryByShop(
    @Body() filterExpenseCategoryDto: FilterAndPaginationExpenseCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.getAllExpenseCategoryByShop(
      shop,
      filterExpenseCategoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getExpenseCategoryBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.getExpenseCategoryBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-expenseCategorys-by-ids')
  async getExpenseCategoryByIds(
    @Body() getExpenseCategoryByIdsDto: GetExpenseCategoryByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.getExpenseCategoryByIds(
      shop,
      getExpenseCategoryByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addExpenseCategory()
   * getExpenseCategoryById()
   * updateExpenseCategoryById()
   * updateMultipleExpenseCategoryById()
   * deleteMultipleExpenseCategoryByIdByVendor()
   * deleteMultipleTrashExpenseCategory()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addExpenseCategory(
    @Body()
    addExpenseCategoryDto: AddExpenseCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.addExpenseCategory(
      req.user,
      shop,
      addExpenseCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getExpenseCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.getExpenseCategoryById(
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
  async updateExpenseCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.updateExpenseCategoryById(
      req.user,
      shop,
      id,
      updateExpenseCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleExpenseCategoryById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.updateMultipleExpenseCategoryById(
      req.user,
      shop,
      updateExpenseCategoryDto.ids,
      updateExpenseCategoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleExpenseCategoryByIdByVendor(
    @Body() deleteExpenseCategoryDto: DeleteExpenseCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.deleteMultipleExpenseCategoryByIdByVendor(
      req.user,
      shop,
      deleteExpenseCategoryDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashExpenseCategory(
    @Body() deleteExpenseCategoryDto: DeleteExpenseCategoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.deleteMultipleTrashExpenseCategory(
      req.user,
      shop,
      deleteExpenseCategoryDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllExpenseCategorys()
   * deleteMultipleExpenseCategoryById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllExpenseCategorys(
    @Body() filterExpenseCategoryDto: FilterAndPaginationExpenseCategoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.expenseCategoryService.getAllExpenseCategorys(
      filterExpenseCategoryDto,
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
  async deleteMultipleExpenseCategoryById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.expenseCategoryService.deleteMultipleExpenseCategoryById(
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
    return await this.expenseCategoryService.deleteAllTrashByShop(shop);
  }
}
