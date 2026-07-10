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

import { AdminMetaRoles } from 'src/pages/admin/decorator/admin-roles.decorator';
import { AdminRolesGuard } from 'src/pages/admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/pages/admin/decorator/admin-permissions.decorator';
import { AdminPermissionGuard } from 'src/pages/admin/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { WebsiteReviewService } from './website-review.service';
import {
  AddWebsiteReviewDto,
  FilterAndPaginationWebsiteReviewDto,
  InsertManyWebsiteReviewDto,
  UpdateWebsiteReviewDto,
} from './dto/website-review.dto';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';

@Controller('website-review')
export class WebsiteReviewController {
  private logger = new Logger(WebsiteReviewController.name);

  constructor(private websiteReviewService: WebsiteReviewService) {}

  /**
   * Public Api
   * 1. getAllWebsiteReviews()
   */
  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllWebsiteReviewForUi(): Promise<ResponsePayload> {
    return await this.websiteReviewService.getAllWebsiteReviewForUi();
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllWebsiteReviews(
    @Body() filterWebsiteReviewDto: FilterAndPaginationWebsiteReviewDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.websiteReviewService.getAllWebsiteReviews(
      filterWebsiteReviewDto,
      searchString,
    );
  }

  /**
   * Admin Api
   * 1. addWebsiteReview()
   * 2. insertManyWebsiteReview()
   * 4. getWebsiteReviewById()
   * 5. updateWebsiteReviewById()
   * 6. updateMultipleWebsiteReviewById()
   * 7. deleteWebsiteReviewById()
   * 8. deleteMultipleWebsiteReviewById()
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
  async addWebsiteReview(
    @Body()
    addWebsiteReviewDto: AddWebsiteReviewDto,
  ): Promise<ResponsePayload> {
    return await this.websiteReviewService.addWebsiteReview(
      addWebsiteReviewDto,
    );
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async insertManyDivision(
    @Body()
    body: InsertManyWebsiteReviewDto,
  ): Promise<ResponsePayload> {
    return await this.websiteReviewService.insertManyWebsiteReview(body.data);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getWebsiteReviewById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.websiteReviewService.getWebsiteReviewById(id, select);
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
  async updateWebsiteReviewById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateWebsiteReviewDto: UpdateWebsiteReviewDto,
  ): Promise<ResponsePayload> {
    return await this.websiteReviewService.updateWebsiteReviewById(
      id,
      updateWebsiteReviewDto,
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
  async updateMultipleWebsiteReviewById(
    @Body() updateWebsiteReviewDto: UpdateWebsiteReviewDto,
  ): Promise<ResponsePayload> {
    return await this.websiteReviewService.updateMultipleWebsiteReviewById(
      updateWebsiteReviewDto.ids,
      updateWebsiteReviewDto,
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
  async deleteWebsiteReviewById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.websiteReviewService.deleteWebsiteReviewById(id);
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
  async deleteMultipleWebsiteReviewById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.websiteReviewService.deleteMultipleWebsiteReviewById(
      data.ids,
    );
  }
}
