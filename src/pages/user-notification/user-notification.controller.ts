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
import { UserNotificationService } from './user-notification.service';

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
  AddUserNotificationDto,
  DeleteUserNotificationDto,
  FilterAndPaginationUserNotificationDto,
  GetUserNotificationByIdsDto,
  UpdateUserNotificationDto,
} from './dto/user-notification.dto';

@Controller('user-notification')
export class UserNotificationController {
  private logger = new Logger(UserNotificationController.name);

  constructor(private userNotificationService: UserNotificationService) {}

  /**
   * Public Api
   * getAllUserNotificationByShop()
   * getUserNotificationBySlug()
   * getUserNotificationByIds()
   */

  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllUserNotificationForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.getAllUserNotificationForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllUserNotificationByShop(
    @Body() filterUserNotificationDto: FilterAndPaginationUserNotificationDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.getAllUserNotificationByShop(
      shop,
      filterUserNotificationDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getUserNotificationBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.getUserNotificationBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-userNotifications-by-ids')
  async getUserNotificationByIds(
    @Body() getUserNotificationByIdsDto: GetUserNotificationByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.getUserNotificationByIds(
      shop,
      getUserNotificationByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addUserNotification()
   * getUserNotificationById()
   * updateUserNotificationById()
   * updateMultipleUserNotificationById()
   * deleteMultipleUserNotificationByIdByVendor()
   * deleteMultipleTrashUserNotification()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addUserNotification(
    @Body()
    addUserNotificationDto: AddUserNotificationDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.addUserNotification(
      req.user,
      shop,
      addUserNotificationDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getUserNotificationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.getUserNotificationById(
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
  async updateUserNotificationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateUserNotificationDto: UpdateUserNotificationDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.updateUserNotificationById(
      req.user,
      shop,
      id,
      updateUserNotificationDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleUserNotificationById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateUserNotificationDto: UpdateUserNotificationDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.updateMultipleUserNotificationById(
      req.user,
      shop,
      updateUserNotificationDto.ids,
      updateUserNotificationDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleUserNotificationByIdByVendor(
    @Body() deleteUserNotificationDto: DeleteUserNotificationDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.deleteMultipleUserNotificationByIdByVendor(
      req.user,
      shop,
      deleteUserNotificationDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashUserNotification(
    @Body() deleteUserNotificationDto: DeleteUserNotificationDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.deleteMultipleTrashUserNotification(
      req.user,
      shop,
      deleteUserNotificationDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllUserNotifications()
   * deleteMultipleUserNotificationById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllUserNotifications(
    @Body() filterUserNotificationDto: FilterAndPaginationUserNotificationDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.userNotificationService.getAllUserNotifications(
      filterUserNotificationDto,
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
  async deleteMultipleUserNotificationById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.userNotificationService.deleteMultipleUserNotificationById(
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
    return await this.userNotificationService.deleteAllTrashByShop(shop);
  }
}
