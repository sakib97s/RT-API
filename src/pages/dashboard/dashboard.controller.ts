import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { AdminMetaRoles } from '../admin/decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';
import { FilterAndPaginationOrderDto } from '../order/dto/order.dto';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';

@Controller('dashboard')
export class DashboardController {
  private logger = new Logger(DashboardController.name);

  constructor(private dashboardService: DashboardService) {}

  /**
   * getAdminDashboard()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-order-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllOrderByShop(
    @Body() filterOrderDto: FilterAndPaginationOrderDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getAllOrderByShop(
      req.user,
      shop,
      filterOrderDto,
      searchString,
    );
  }

  /**
   * getDashboardForAffiliate()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-affiliate')
  async getAllAffiliate(
    @Body() filterDto: any,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getAllAffiliate(filterDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-affiliate-info-for-owner')
  async getAllAffiliateInfoForOwner(
    @Body() filterDto: any,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getAllAffiliateInfoForOwner(
      filterDto,
      searchString,
    );
  }


  /**
   * getAdminDashboard()
   */

  @Version(VERSION_NEUTRAL)
  @Get('/admin-dashboard')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminAuthGuard)
  async getAdminDashboard(): Promise<ResponsePayload> {
    return await this.dashboardService.getAdminDashboard();
  }


  @Version(VERSION_NEUTRAL)
  @Get('/dashboard-product-count-by-vendor')
  @UseGuards(VendorAuthGuard)
  @UseGuards(VendorAuthGuard)
  async getDashboardProductCountByVendor(
    @Req() req: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getVendorDashboard(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/dashboard-category-by-product')
  @UseGuards(VendorAuthGuard)
  @UseGuards(VendorAuthGuard)
  async getDashboardCategoryByProduct(
    @Req() req: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getDashboardCategoryByProduct(
      req.user,
      shop,
    );
  }

  @Get('/dashboard-graph-by-shop')
  async getSalesData(
    @Query('period') period: string,
    @Query('shop') shop: string,
  ) {
    return this.dashboardService.getSalesData(period, shop);
  }

  @Get('/dashboard-graph-by-affiliate')
  async getAffiliateData(
    @Query('period') period: string,
    @Query('affiliateId') affiliateId: string,
  ) {
    return this.dashboardService.getAffiliateData(period, affiliateId);
  }


  @Version(VERSION_NEUTRAL)
  @Post('/get-all-shop-report')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllShopReport(
    @Body() filterDto: any,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.dashboardService.getAllShopReportCompact(filterDto, searchString);
  }

  /**
   * POS Dashboard Methods
   * getPOSDashboard()
   * getPOSSalesSummary()
   */
  @Version(VERSION_NEUTRAL)
  @Get('/pos-dashboard')
  @UseGuards(VendorAuthGuard)
  async getPOSDashboard(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('day') day: number,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getPOSDashboard(
      req.user,
      shop,
      day || 0,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/pos-sales-summary')
  @UseGuards(VendorAuthGuard)
  async getPOSSalesSummary(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getPOSSalesSummary(
      req.user,
      shop,
      startDate,
      endDate,
    );
  }
}
