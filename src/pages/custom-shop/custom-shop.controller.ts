import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { AdminMetaRoles } from '../admin/decorator/admin-roles.decorator';
import { AdminRoles } from 'src/enum/admin-roles.enum';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from '../admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from 'src/enum/admin-permission.enum';
import { AdminPermissionGuard } from '../admin/guards/admin-permission.guard';

import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';

import {
  FilterAndPaginationCustomShopDto,
  InsertManyCustomShopDto,
  UpdateCustomShopDto,
} from './dto/custom-shop.dto';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';
import { CustomShopService } from './custom-shop.service';

@Controller('custom-shop')
export class CustomShopController {
  private logger = new Logger(CustomShopController.name);

  constructor(private customShopService: CustomShopService) {}

  /**
   * Frontend
   */

  /**
   * checkCustomShopAvailability()
   * addCustomShop()
   * insertManyCustomShop()
   * getAllCustomShop()
   * getAllCustomShopBasic()
   * getCustomShopById()
   * updateCustomShopById()
   * updateMultipleCustomShopById()
   * deleteCustomShopById()
   * deleteMultipleCustomShopById()
   */

  // @Post('/create-vendor-and-custom-shop')
  // @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.CREATE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminAuthGuard)
  // async createVendorAndCustomShop(
  //   @Body()
  //   addVendorAndCustomShopDto: AddVendorAndCustomShopDto,
  //   @Req() req: any,
  // ): Promise<ResponsePayload> {
  //   return await this.customShopService.createVendorAndCustomShop(
  //     req.user,
  //     addVendorAndCustomShopDto,
  //   );
  // }

  // @Post('/create')
  // @ApiHeader({
  //   name: 'vendor',
  //   description: VENDOR_AUTH_TOKEN_DEV,
  //   required: true,
  // })

  // @UseGuards(AffiliateAuthGuard)
  // async createCustomShop(
  //   @Body()
  //   addCustomShopDto: AddCustomShopDto,
  //   @Req() req: any,
  // ): Promise<ResponsePayload> {
  //   return await this.customShopService.createCustomShop(
  //     req.user,
  //     addCustomShopDto,
  //   );
  // }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async insertManyCustomShop(
    @Body()
    body: InsertManyCustomShopDto,
  ): Promise<ResponsePayload> {
    return await this.customShopService.insertManyCustomShop(
      body.data,
      body.option,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllCustomShop(
    @Body() filterCustomShopDto: FilterAndPaginationCustomShopDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.customShopService.getAllCustomShop(
      filterCustomShopDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-basic')
  async getAllCustomShopBasic(): Promise<ResponsePayload> {
    return await this.customShopService.getAllCustomShopBasic();
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by/:id')
  async getCustomShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.customShopService.getCustomShopById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-custom-shop-info-by/:id')
  async getCustomShopInfoById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.customShopService.getCustomShopInfoById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.SUPER_ADMIN,
    AdminRoles.EDITOR,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateCustomShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateCustomShopDto: UpdateCustomShopDto,
  ): Promise<ResponsePayload> {
    return await this.customShopService.updateCustomShopById(
      id,
      updateCustomShopDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-custom-shop-vendor-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async updateCustomShopByVendorById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateCustomShopDto: UpdateCustomShopDto,
  ): Promise<ResponsePayload> {
    return await this.customShopService.updateCustomShopById(
      id,
      updateCustomShopDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleCustomShopById(
    @Body() updateCustomShopDto: UpdateCustomShopDto,
  ): Promise<ResponsePayload> {
    return await this.customShopService.updateMultipleCustomShopById(
      updateCustomShopDto.ids,
      updateCustomShopDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.SUPER_ADMIN,
    AdminRoles.EDITOR,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteCustomShopById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.customShopService.deleteCustomShopById(
      id,
      Boolean(checkUsage),
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.SUPER_ADMIN,
    AdminRoles.EDITOR,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleCustomShopById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.customShopService.deleteMultipleCustomShopById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
