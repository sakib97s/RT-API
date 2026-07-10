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
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { PaymentLinkHistoryService } from './payment-link-history.service';
import {
  AddPaymentLinkHistoryDto,
  DeletePaymentLinkHistoryDto,
  FilterAndPaginationPaymentLinkHistoryDto,
  GetPaymentLinkHistoryByIdsDto,
  UpdatePaymentLinkHistoryDto,
} from './dto/payment-link-history.dto';
import { AdminMetaRoles } from 'src/pages/admin/decorator/admin-roles.decorator';
import { AdminRoles } from 'src/enum/admin-roles.enum';
import { AdminRolesGuard } from 'src/pages/admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/pages/admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from 'src/enum/admin-permission.enum';
import { AdminPermissionGuard } from 'src/pages/admin/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { AffiliateAuthGuard } from 'src/pages/affiliate/guards/affiliate-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';
import { Response } from 'express';
import { CreatePreShopDto } from '../shop/dto/shop.dto';

@Controller('payment-link-history')
export class PaymentLinkHistoryController {
  private logger = new Logger(PaymentLinkHistoryController.name);

  constructor(private paymentLinkHistoryService: PaymentLinkHistoryService) {}

  /**
   * Frontend
   */

  @Post('/create-payment-link-history')
  @UsePipes(ValidationPipe)
  async createPaymentLinkHistory(
    @Body()
    addPaymentLinkHistoryDto: AddPaymentLinkHistoryDto,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.createPaymentLinkHistory(
      addPaymentLinkHistoryDto,
    );
  }

  /**
   * Public Api
   * getAllPaymentLinkHistoryByShop()
   * getPaymentLinkHistoryBySlug()
   * getPaymentLinkHistoryByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllPaymentLinkHistoryByShop(
    @Body()
    filterPaymentLinkHistoryDto: FilterAndPaginationPaymentLinkHistoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.getAllPaymentLinkHistoryByShop(
      shop,
      filterPaymentLinkHistoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getPaymentLinkHistoryBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.getPaymentLinkHistoryBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-paymentLinkHistorys-by-ids')
  async getPaymentLinkHistoryByIds(
    @Body() getPaymentLinkHistoryByIdsDto: GetPaymentLinkHistoryByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.getPaymentLinkHistoryByIds(
      shop,
      getPaymentLinkHistoryByIdsDto,
      select,
    );
  }

  /**
   * Affiliate Secure Api
   * addPaymentLinkHistory()
   * deleteMultiplePaymentLinkHistoryByIdByAffiliate()
   */

  @Post('/add')
  @UseGuards(AffiliateAuthGuard)
  async addPaymentLinkHistory(
    @Body()
    addPaymentLinkHistoryDto: AddPaymentLinkHistoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.addPaymentLinkHistory(
      addPaymentLinkHistoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(AffiliateAuthGuard)
  async deleteMultiplePaymentLinkHistoryByIdByAffiliate(
    @Body() deletePaymentLinkHistoryDto: DeletePaymentLinkHistoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.deleteMultiplePaymentLinkHistoryByIdByAffiliate(
      shop,
      deletePaymentLinkHistoryDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(AffiliateAuthGuard)
  async deleteMultipleTrashPaymentLinkHistory(
    @Body() deletePaymentLinkHistoryDto: DeletePaymentLinkHistoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.deleteMultipleTrashPaymentLinkHistory(
      shop,
      deletePaymentLinkHistoryDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * addPaymentLinkHistoryByAdmin()
   * getAllPaymentLinkHistorys()
   * getPaymentLinkHistoryById()
   * updatePaymentLinkHistoryById()
   * updateMultiplePaymentLinkHistoryById()
   * deleteMultiplePaymentLinkHistoryById()
   */

  @Post('/add-by-admin')
  @UseGuards(AdminAuthGuard)
  async addPaymentLinkHistoryByAdmin(
    @Body()
    addPaymentLinkHistoryDto: AddPaymentLinkHistoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.addPaymentLinkHistory(
      addPaymentLinkHistoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllPaymentLinkHistorys(
    @Body()
    filterPaymentLinkHistoryDto: FilterAndPaginationPaymentLinkHistoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.paymentLinkHistoryService.getAllPaymentLinkHistorys(
      filterPaymentLinkHistoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-affiliate')
  @UsePipes(ValidationPipe)
  @UseGuards(AffiliateAuthGuard)
  async getAllPaymentLinkHistorysByAffiliate(
    @Body()
    filterPaymentLinkHistoryDto: FilterAndPaginationPaymentLinkHistoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.paymentLinkHistoryService.getAllPaymentLinkHistorys(
      filterPaymentLinkHistoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-user')
  // @UsePipes(ValidationPipe)
  async getAllPaymentLinkHistorysByUser(
    @Body()
    filterPaymentLinkHistoryDto: FilterAndPaginationPaymentLinkHistoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.paymentLinkHistoryService.getAllPaymentLinkHistorys(
      filterPaymentLinkHistoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  async getPaymentLinkHistoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    console.log('d');
    return await this.paymentLinkHistoryService.getPaymentLinkHistoryById(
      id,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  async updatePaymentLinkHistoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updatePaymentLinkHistoryDto: UpdatePaymentLinkHistoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.updatePaymentLinkHistoryById(
      id,
      updatePaymentLinkHistoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  async updateMultiplePaymentLinkHistoryById(
    @Body() updatePaymentLinkHistoryDto: UpdatePaymentLinkHistoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.updateMultiplePaymentLinkHistoryById(
      updatePaymentLinkHistoryDto.ids,
      updatePaymentLinkHistoryDto,
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
  async deleteMultiplePaymentLinkHistoryById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.deleteMultiplePaymentLinkHistoryById(
      data.ids,
    );
  }

  /**
   * Payment Control Methods
   * callbackSslCommerzPayment()
   */

  @Post('/callback-ssl-commerz-payment')
  async callbackSslCommerzPayment(
    @Res() res: Response,
    @Query('tran_id') tran_id: string,
    @Query('status') status: string,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkHistoryService.callbackSslCommerzPayment(
      res,
      tran_id,
      status,
    );
  }
}
