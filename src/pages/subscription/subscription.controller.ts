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
import { SubscriptionService } from './subscription.service';
import {
  AddSubscriptionDto,
  DeleteSubscriptionDto,
  FilterAndPaginationSubscriptionDto,
  GetSubscriptionByIdsDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { AdminMetaRoles } from 'src/decorator/admin-roles.decorator';
import { AdminRoles } from 'src/enum/admin-roles.enum';
import { AdminRolesGuard } from 'src/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/decorator/admin-permissions.decorator';
import { AdminPermissions } from 'src/enum/admin-permission.enum';
import { AdminPermissionGuard } from 'src/guards/admin-permission.guard';
import { AdminJwtAuthGuard } from 'src/guards/admin-jwt-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { VendorAuthGuard } from 'src/pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';

@Controller('subscription')
export class SubscriptionController {
  private logger = new Logger(SubscriptionController.name);

  constructor(private subscriptionService: SubscriptionService) {}

  /**
   * Public Api
   * getAllSubscriptionByShop()
   * getSubscriptionBySlug()
   * getSubscriptionByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllSubscriptionByShop(
    @Body() filterSubscriptionDto: FilterAndPaginationSubscriptionDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.getAllSubscriptionByShop(
      shop,
      filterSubscriptionDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getSubscriptionBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.getSubscriptionBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-subscriptions-by-ids')
  async getSubscriptionByIds(
    @Body() getSubscriptionByIdsDto: GetSubscriptionByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.getSubscriptionByIds(
      shop,
      getSubscriptionByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addSubscription()
   * getSubscriptionById()
   * updateSubscriptionById()
   * updateMultipleSubscriptionById()
   * deleteMultipleSubscriptionByIdByVendor()
   * deleteMultipleTrashSubscription()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addSubscription(
    @Body()
    addSubscriptionDto: AddSubscriptionDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.addSubscription(
      req.user,
      addSubscriptionDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getSubscriptionById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.getSubscriptionById(
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
  async updateSubscriptionById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.updateSubscriptionById(
      req.user,
      shop,
      id,
      updateSubscriptionDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleSubscriptionById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.updateMultipleSubscriptionById(
      req.user,
      shop,
      updateSubscriptionDto.ids,
      updateSubscriptionDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleSubscriptionByIdByVendor(
    @Body() deleteSubscriptionDto: DeleteSubscriptionDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.deleteMultipleSubscriptionByIdByVendor(
      req.user,
      shop,
      deleteSubscriptionDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashSubscription(
    @Body() deleteSubscriptionDto: DeleteSubscriptionDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.deleteMultipleTrashSubscription(
      req.user,
      shop,
      deleteSubscriptionDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllSubscriptions()
   * deleteMultipleSubscriptionById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getAllSubscriptions(
    @Body() filterSubscriptionDto: FilterAndPaginationSubscriptionDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.subscriptionService.getAllSubscriptions(
      filterSubscriptionDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-report')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getAllSubscriptionsReport(
    @Body() filterSubscriptionDto: FilterAndPaginationSubscriptionDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.subscriptionService.getAllSubscriptionsReport(
      filterSubscriptionDto,
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
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleSubscriptionById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.deleteMultipleSubscriptionById(
      data.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-subscription-report')
  @UsePipes(ValidationPipe)
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleSubscriptionReportById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.subscriptionService.deleteMultipleSubscriptionReportById(
      data.ids,
    );
  }
}
