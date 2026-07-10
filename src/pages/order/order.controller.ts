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
import { OrderService } from './order.service';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { AdminMetaRoles } from '../admin/decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import {
  AddOrderByUserDto,
  AddOrderDto,
  FilterAndPaginationOrderDto,
  GenerateInvoicesDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { UserAuthGuard } from '../user/guards/user-auth.guard';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';
import { DeleteProductDto } from '../product/dto/product.dto';
import { AdminMetaPermissions } from '../admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from '../admin/guards/admin-permission.guard';
import { Response } from 'express';
import { GetUserByIdsDto } from '../user/dto/user.dto';

@Controller('order')
export class OrderController {
  private logger = new Logger(OrderController.name);

  constructor(private orderService: OrderService) {}

  /**
   * Vendor Secure Api
   * addOrder()
   * getAllOrderByShop()
   * updateOrderById()
   */

  // @Get('/get-all-data')
  // @UsePipes(ValidationPipe)
  // async getAllOrderForUi(
  //   @Query('shop', MongoIdValidationPipe) shop: string,
  // ): Promise<ResponsePayload> {
  //   return await this.orderService.getAllOrderForUi(shop);
  // }

  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllOrderForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('page') page = 1,
    @Query('limit') limit = 3,
  ): Promise<ResponsePayload> {
    return await this.orderService.getAllOrderForUi(shop, +page, +limit);
  }

  @Post('/add')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addOrder(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    addOrderDto: AddOrderDto,
  ): Promise<ResponsePayload> {
    return await this.orderService.addOrder(shop, addOrderDto);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllOrderByShop(
    @Body() filterOrderDto: FilterAndPaginationOrderDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.getAllOrderByShop(
      req.user,
      shop,
      filterOrderDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-incomplete-order-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllIncompleteOrderByShop(
    @Body() filterOrderDto: FilterAndPaginationOrderDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.getAllIncompleteOrderByShop(
      req.user,
      shop,
      filterOrderDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-users-data-by-phone-no')
  async getUserDataByPhoneNo(
    @Body() getUserByIdsDto: GetUserByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.getUserDataByPhoneNo(
      shop,
      getUserByIdsDto,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateOrderById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.updateOrderById(
      req.user,
      shop,
      id,
      updateOrderDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-by-user/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateOrderUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.updateOrderUserById(
      req.user,
      shop,
      id,
      updateOrderDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-incomplete-order-by-id/:id')
  @UsePipes(ValidationPipe)
  async updateIncompleteOrderById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.updateIncompleteOrderById(
      shop,
      id,
      updateOrderDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleOrderById(
    @Body() updateOrderDto: UpdateOrderDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.updateMultipleOrderById(
      req.user,
      shop,
      updateOrderDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleProductByIdByVendor(
    @Body() deleteProductDto: DeleteProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.deleteMultipleOrderByIdByVendor(
      req.user,
      shop,
      deleteProductDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-incomplete-orders')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleIncompleteOrderById(
    @Body() deleteProductDto: DeleteProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.deleteMultipleIncompleteOrderById(
      req.user,
      shop,
      deleteProductDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-orders')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleOrdersById(
    @Body() deleteProductDto: DeleteProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.deleteMultipleOrdersById(
      req.user,
      shop,
      deleteProductDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashProduct(
    @Body() deleteProductDto: DeleteProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.deleteMultipleTrashOrder(
      req.user,
      shop,
      deleteProductDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.deleteAllTrashByShop(shop);
  }

  /**
   * User Secure Api
   * addOrderByUser()
   * getAllOrdersByUser()
   * updateOrderBeforePaymentByUser()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/check-user-block-or-not')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async checkIsUserBlockOrNot(
    @Body() addOrderByUserDto: AddOrderByUserDto,
    @Req() req: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    const userIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    return this.orderService.checkIsUserBlockOrNot(
      shop,
      req.user,
      addOrderByUserDto,
      userIpAddress,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/add-order-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addOrderByUser(
    @Body() addOrderByUserDto: AddOrderByUserDto,
    @Req() req: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    const userIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    return this.orderService.addOrderByUser(
      shop,
      req.user,
      addOrderByUserDto,
      userIpAddress,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/add-order-by-anonymous')
  async addOrderByAnonymous(
    @Body() addOrderByUserDto: AddOrderByUserDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    const userIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    return this.orderService.addOrderByAnonymous(
      shop,
      addOrderByUserDto,
      userIpAddress,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-orders-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllOrdersByUser(
    @Body() filterOrderDto: FilterAndPaginationOrderDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.orderService.getAllOrdersByUser(
      shop,
      req.user,
      filterOrderDto,
      searchString,
    );
  }

  /**
   * Admin Secure Api
   * getAllOrders()
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllOrders(
    @Body() filterOrderDto: FilterAndPaginationOrderDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.orderService.getAllOrders(filterOrderDto, searchString);
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
  async deleteMultipleProductById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.orderService.deleteMultipleOrderById(data.ids);
  }

  /**
   * Incomplete Order Api
   * addIncompleteOrder()
   * getAllOrdersByUser()
   * updateOrderBeforePaymentByUser()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/add-incomplete-order-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addIncompleteOrderByUser(
    @Body() addOrderByUserDto: AddOrderByUserDto,
    @Req() req: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    const userIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    return this.orderService.addIncompleteOrderByUser(
      shop,
      req.user,
      addOrderByUserDto,
      userIpAddress,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/add-incomplete-order-by-anonymous')
  async addIncompleteOrderByAnonymous(
    @Body() addOrderByUserDto: AddOrderByUserDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    const userIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    return this.orderService.addIncompleteOrderByAnonymous(
      shop,
      addOrderByUserDto,
      userIpAddress,
    );
  }

  /**
   * Public API
   * getOrderById()
   */

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-id/:id')
  async getOrderById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.getOrderById(id, select);
  }

  @Get('/get-by-phone')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getOrdersByPhone(@Query() q: any) {
    return await this.orderService.getOrdersByPhone(
      q.phone,
      q.select,
      q.page,
      q.limit,
      q.sort,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-incomplete-order-by-id/:id')
  async getIncompleteOrderById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.getIncompleteOrderById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-order-by-order-id/:orderId')
  async getOrderByOrderId(
    @Param('orderId') orderId: string,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.getOrderByOrderId(shop, orderId, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/check-fraud-order/:phoneNo')
  async checkFraudOrder(
    @Param('phoneNo') phoneNo: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.checkFraudOrder(shop, phoneNo);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllOrderByUser(
    @Body() filterOrderDto: FilterAndPaginationOrderDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.orderService.getAllOrderByUser(
      req.user,
      shop,
      filterOrderDto,
      searchString,
    );
  }

  /**
   *Multiple Invoice Method
   * generateInvoices()
   */

  @Post('/generate-invoices')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async generateInvoices(
    @Body() dto: GenerateInvoicesDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.orderService.generateInvoicesByIds(shop, req.user, dto.ids);
  }

  /**
   * Invoice Method
   * generateInvoiceById()
   */
  @Get('/generate-invoice/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async generateInvoiceById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.orderService.generateInvoiceById(shop, req.user, id);
  }

  /**
   * Invoice Method
   * generateInvoiceById()
   */
  @Get('/generate-invoice-user/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async generateInvoiceUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.orderService.generateInvoiceUserById(shop, req.user, id);
  }

  /**
   * Increment Invoice Print Count
   * incrementInvoicePrintCount()
   */
  @Version(VERSION_NEUTRAL)
  @Put('/increment-invoice-print-count/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async incrementInvoicePrintCount(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return this.orderService.incrementInvoicePrintCount(id);
  }

  /**
   * Payment Control Methods
   * callbackBkashPayment()
   * callbackSslCommerzPayment()
   */
  @Get('/callback-bkash-payment')
  async callbackBkashPayment(
    @Res() res: Response,
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.callbackBkashPayment(res, paymentID, status);
  }

  @Post('/callback-ssl-commerz-payment')
  async callbackSslCommerzPayment(
    @Res() res: Response,
    @Query('tran_id') tran_id: string,
    @Query('status') status: string,
  ): Promise<ResponsePayload> {
    return await this.orderService.callbackSslCommerzPayment(
      res,
      tran_id,
      status,
    );
  }

  // order.controller.ts

  @Get('/callback-stripe-payment')
  async callbackStripePayment(
    @Res() res: Response,
    @Query('status') status: string,
    @Query('orderId') orderId: string,
    @Query('sessionId') sessionId: string,
  ): Promise<any> {
    return this.orderService.callbackStripePayment(
      res,
      status,
      orderId,
      sessionId,
    );
  }
}
