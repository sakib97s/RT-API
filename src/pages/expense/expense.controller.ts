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
import { ExpenseService } from './expense.service';
import {
  AddExpenseDto,
  DeleteExpenseDto,
  FilterAndPaginationExpenseDto,
  GetExpenseByIdsDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
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

@Controller('expense')
export class ExpenseController {
  private logger = new Logger(ExpenseController.name);

  constructor(private expenseService: ExpenseService) {}

  /**
   * Public Api
   * getAllExpenseByShop()
   * getExpenseBySlug()
   * getExpenseByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllExpenseByShop(
    @Body() filterExpenseDto: FilterAndPaginationExpenseDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.expenseService.getAllExpenseByShop(
      shop,
      filterExpenseDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getExpenseBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.expenseService.getExpenseBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-expenses-by-ids')
  async getExpenseByIds(
    @Body() getExpenseByIdsDto: GetExpenseByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.expenseService.getExpenseByIds(
      shop,
      getExpenseByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addExpense()
   * getExpenseById()
   * updateExpenseById()
   * updateMultipleExpenseById()
   * deleteMultipleExpenseByIdByVendor()
   * deleteMultipleTrashExpense()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addExpense(
    @Body()
    addExpenseDto: AddExpenseDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseService.addExpense(req.user, shop, addExpenseDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getExpenseById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseService.getExpenseById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateExpenseById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseService.updateExpenseById(
      req.user,
      shop,
      id,
      updateExpenseDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleExpenseById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseService.updateMultipleExpenseById(
      req.user,
      shop,
      updateExpenseDto.ids,
      updateExpenseDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleExpenseByIdByVendor(
    @Body() deleteExpenseDto: DeleteExpenseDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseService.deleteMultipleExpenseByIdByVendor(
      req.user,
      shop,
      deleteExpenseDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashExpense(
    @Body() deleteExpenseDto: DeleteExpenseDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.expenseService.deleteMultipleTrashExpense(
      req.user,
      shop,
      deleteExpenseDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllExpenses()
   * deleteMultipleExpenseById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllExpenses(
    @Body() filterExpenseDto: FilterAndPaginationExpenseDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.expenseService.getAllExpenses(filterExpenseDto, searchString);
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
  async deleteMultipleExpenseById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.expenseService.deleteMultipleExpenseById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.expenseService.deleteAllTrashByShop(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/summary')
  async getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category') category?: string,
  ): Promise<any> {
    return {
      success: true,
      data: await this.expenseService.summaryByCategory({ from, to, category }),
    };
  }

  @Version(VERSION_NEUTRAL)
  @Get('/report')
  async getReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('period') period?: 'weekly' | 'monthly' | 'yearly',
  ): Promise<any> {
    return {
      success: true,
      data: await this.expenseService.report({ from, to, period }),
    };
  }

  @Version(VERSION_NEUTRAL)
  @Get('/dashboard')
  async getExpenseDashboard(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category') category?: string,
  ): Promise<ResponsePayload> {
    return await this.expenseService.getExpenseDashboard(shop, {
      from,
      to,
      category,
    });
  }

  @Version(VERSION_NEUTRAL)
  @Get('/test')
  async testExpenseData(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    try {
      // Simple test to check if data exists
      const testData = await this.expenseService.getAllExpenseByShop(
        shop,
        {
          filter: {
            status: { $ne: 'trash' }
          } as any,
          pagination: {
            currentPage: 0,
            pageSize: 5
          },
          sort: {
            createdAt: -1
          },
          filterGroup: null,
          select: {}
        } as any
      );
      
      return testData;
    } catch (error) {
      return {
        success: false,
        message: 'Test failed: ' + error.message,
      } as ResponsePayload;
    }
  }

  @Version(VERSION_NEUTRAL)
  @Get('/test-date-range')
  async testDateRangeFilter(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<ResponsePayload> {
    try {
      console.log('Testing date range filter:', { shop, from, to });
      
      const testData = await this.expenseService.getAllExpenseByShop(
        shop,
        {
          filter: {
            date: {
              $gte: from,
              $lte: to
            },
            status: { $ne: 'trash' }
          } as any,
          pagination: {
            currentPage: 0,
            pageSize: 10
          },
          sort: {
            createdAt: -1
          },
          filterGroup: null,
          select: {}
        } as any
      );
      
      return testData;
    } catch (error) {
      return {
        success: false,
        message: 'Date range test failed: ' + error.message,
      } as ResponsePayload;
    }
  }

  @Version(VERSION_NEUTRAL)
  @Get('/by-date-range')
  async getExpensesByDateRange(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<ResponsePayload> {
    return await this.expenseService.getExpensesByDateRange(shop, from, to);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/with-summary')
  async getExpensesWithSummary(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    try {
      const result = await this.expenseService.getAllExpenseByShop(
        shop,
        {
          filter: {
            status: { $ne: 'trash' }
          } as any,
          pagination: {
            currentPage: 0,
            pageSize: 50
          },
          sort: {
            createdAt: -1
          },
          filterGroup: null,
          select: {}
        } as any
      );
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get expenses with summary: ' + error.message,
      } as ResponsePayload;
    }
  }
}
