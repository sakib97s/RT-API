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
import { PaymentLinkService } from './payment-link.service';
import {
  AddPaymentLinkDto,
  DeletePaymentLinkDto,
  FilterAndPaginationPaymentLinkDto,
  GetPaymentLinkByIdsDto,
  UpdatePaymentLinkDto,
} from './dto/payment-link.dto';
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

@Controller('payment-link')
export class PaymentLinkController {
  private logger = new Logger(PaymentLinkController.name);

  constructor(private paymentLinkService: PaymentLinkService) {}

  /**
   * Public Api
   * getAllPaymentLinkByShop()
   * getPaymentLinkBySlug()
   * getPaymentLinkByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllPaymentLinkByShop(
    @Body() filterPaymentLinkDto: FilterAndPaginationPaymentLinkDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.getAllPaymentLinkByShop(
      shop,
      filterPaymentLinkDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getPaymentLinkBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.getPaymentLinkBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-paymentLinks-by-ids')
  async getPaymentLinkByIds(
    @Body() getPaymentLinkByIdsDto: GetPaymentLinkByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.getPaymentLinkByIds(
      shop,
      getPaymentLinkByIdsDto,
      select,
    );
  }

  /**
   * Affiliate Secure Api
   * addPaymentLink()
   * deleteMultiplePaymentLinkByIdByAffiliate()
   */

  @Post('/add')
  @UseGuards(AffiliateAuthGuard)
  async addPaymentLink(
    @Body()
    addPaymentLinkDto: AddPaymentLinkDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.addPaymentLink(
      req.user,
      addPaymentLinkDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(AffiliateAuthGuard)
  async deleteMultiplePaymentLinkByIdByAffiliate(
    @Body() deletePaymentLinkDto: DeletePaymentLinkDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.deleteMultiplePaymentLinkByIdByAffiliate(
      req.user,
      shop,
      deletePaymentLinkDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(AffiliateAuthGuard)
  async deleteMultipleTrashPaymentLink(
    @Body() deletePaymentLinkDto: DeletePaymentLinkDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.deleteMultipleTrashPaymentLink(
      req.user,
      shop,
      deletePaymentLinkDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * addPaymentLinkByAdmin()
   * getAllPaymentLinks()
   * getPaymentLinkById()
   * updatePaymentLinkById()
   * updateMultiplePaymentLinkById()
   * deleteMultiplePaymentLinkById()
   */

  @Post('/add-by-admin')
  @UseGuards(AdminAuthGuard)
  async addPaymentLinkByAdmin(
    @Body()
    addPaymentLinkDto: AddPaymentLinkDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.addPaymentLink(
      req.user,
      addPaymentLinkDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllPaymentLinks(
    @Body() filterPaymentLinkDto: FilterAndPaginationPaymentLinkDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.paymentLinkService.getAllPaymentLinks(
      filterPaymentLinkDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-affiliate')
  @UsePipes(ValidationPipe)
  @UseGuards(AffiliateAuthGuard)
  async getAllPaymentLinksByAffiliate(
    @Body() filterPaymentLinkDto: FilterAndPaginationPaymentLinkDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.paymentLinkService.getAllPaymentLinks(
      filterPaymentLinkDto,
      searchString,
    );
  }


  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-user')
  // @UsePipes(ValidationPipe)

  async getAllPaymentLinksByUser(
    @Body() filterPaymentLinkDto: FilterAndPaginationPaymentLinkDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.paymentLinkService.getAllPaymentLinks(
      filterPaymentLinkDto,
      searchString,
    );
  }



  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  async getPaymentLinkById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    console.log('d');
    return await this.paymentLinkService.getPaymentLinkById(
      req.user,
      id,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  async updatePaymentLinkById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updatePaymentLinkDto: UpdatePaymentLinkDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.updatePaymentLinkById(
      req.user,
      id,
      updatePaymentLinkDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  async updateMultiplePaymentLinkById(
    @Body() updatePaymentLinkDto: UpdatePaymentLinkDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.updateMultiplePaymentLinkById(
      req.user,

      updatePaymentLinkDto.ids,
      updatePaymentLinkDto,
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
  async deleteMultiplePaymentLinkById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.paymentLinkService.deleteMultiplePaymentLinkById(
      data.ids,
    );
  }
}
