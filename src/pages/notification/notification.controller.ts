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
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

import {
  AddNotificationDto,
  FilterAndPaginationNotificationDto,
  InsertManyNotificationDto,
  UpdateNotificationDto,
} from './dto/notification.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { UserAuthGuard } from '../user/guards/user-auth.guard';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';

@Controller('notification')
export class NotificationController {
  private logger = new Logger(NotificationController.name);

  constructor(private notificationService: NotificationService) {}

  /**
   * Vendor Secure Api
   * getAllNotificationByShop()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllNotificationByShop(
    @Body() filterNotificationDto: FilterAndPaginationNotificationDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.notificationService.getAllNotificationByShop(
      req.user,
      shop,
      filterNotificationDto,
      searchString,
    );
  }

  /**
   * addNotification()
   * insertManyNotification()
   * getAllNotifications()
   * getAllNotificationsBasic()
   * getNotificationById()
   * updateNotificationById()
   * updateMultipleNotificationById()
   * deleteNotificationById()
   * deleteMultipleNotificationById()
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addNotification(
    @Body()
    addNotificationDto: AddNotificationDto,
  ): Promise<ResponsePayload> {
    return await this.notificationService.addNotification(addNotificationDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async insertManyNotification(
    @Body()
    body: InsertManyNotificationDto,
  ): Promise<ResponsePayload> {
    return await this.notificationService.insertManyNotification(
      body.data,
      body.option,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllNotifications(
    @Body() filterNotificationDto: FilterAndPaginationNotificationDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.notificationService.getAllNotifications(
      filterNotificationDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-notification-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllNotificationsByUser(
    @Body() filterNotificationDto: FilterAndPaginationNotificationDto,
    @Query('q') searchString: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.notificationService.getAllNotificationsByUser(
      req.user,
      filterNotificationDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-basic')
  async getAllNotificationsBasic(): Promise<ResponsePayload> {
    return await this.notificationService.getAllNotificationsBasic();
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by/:id')
  async getNotificationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.notificationService.getNotificationById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateNotificationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<ResponsePayload> {
    return await this.notificationService.updateNotificationById(
      id,
      updateNotificationDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleNotificationById(
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<ResponsePayload> {
    return await this.notificationService.updateMultipleNotificationById(
      updateNotificationDto.ids,
      updateNotificationDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteNotificationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.notificationService.deleteNotificationById(
      id,
      Boolean(checkUsage),
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleNotificationById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.notificationService.deleteMultipleNotificationById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
