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
import { AnnouncementService } from './announcement.service';
import { MongoIdValidationPipe } from '../../../pipes/mongo-id-validation.pipe';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { AdminMetaRoles } from '../../admin/decorator/admin-roles.decorator';
import { AdminRoles } from '../../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from '../../admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../../enum/admin-permission.enum';
import { AdminPermissionGuard } from '../../admin/guards/admin-permission.guard';
import {
  AddAnnouncementDto,
  FilterAndPaginationAnnouncementDto,
  InsertManyAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';
import { AdminAuthGuard } from '../../admin/guards/admin-auth.guard';

@Controller('announcement')
export class AnnouncementController {
  private logger = new Logger(AnnouncementController.name);

  constructor(private announcementService: AnnouncementService) {}

  /**
   * Public Api
   * getAllAnnouncements()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllAnnouncements(
    @Body() filterAnnouncementDto: FilterAndPaginationAnnouncementDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.announcementService.getAllAnnouncements(
      filterAnnouncementDto,
      searchString,
    );
  }

  /**
   * Admin Secure Api
   * addAnnouncement()
   * insertManyAnnouncement()
   * getAllAnnouncementsBasic()
   * getAnnouncementById()
   * updateAnnouncementById()
   * updateMultipleAnnouncementById()
   * deleteAnnouncementById()
   * deleteMultipleAnnouncementById()
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.SUPER_ADMIN,
    AdminRoles.EDITOR,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async addAnnouncement(
    @Body()
    addAnnouncementDto: AddAnnouncementDto,
  ): Promise<ResponsePayload> {
    return await this.announcementService.addAnnouncement(addAnnouncementDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async insertManyAnnouncement(
    @Body()
    body: InsertManyAnnouncementDto,
  ): Promise<ResponsePayload> {
    return await this.announcementService.insertManyAnnouncement(
      body.data,
      body.option,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-basic')
  async getAllAnnouncementsBasic(): Promise<ResponsePayload> {
    return await this.announcementService.getAllAnnouncementsBasic();
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  async getAnnouncementById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.announcementService.getAnnouncementById(id, select);
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
  async updateAnnouncementById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<ResponsePayload> {
    return await this.announcementService.updateAnnouncementById(
      id,
      updateAnnouncementDto,
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
  async updateMultipleAnnouncementById(
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<ResponsePayload> {
    return await this.announcementService.updateMultipleAnnouncementById(
      updateAnnouncementDto.ids,
      updateAnnouncementDto,
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
  async deleteAnnouncementById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.announcementService.deleteAnnouncementById(
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
  async deleteMultipleAnnouncementById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.announcementService.deleteMultipleAnnouncementById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
