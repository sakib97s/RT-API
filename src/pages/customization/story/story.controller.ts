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
import { StoryService } from './story.service';
import {
  AddStoryDto,
  DeleteStoryDto,
  FilterAndPaginationStoryDto,
  GetStoryByIdsDto,
  UpdateStoryDto,
} from './dto/story.dto';
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

@Controller('story')
export class StoryController {
  private logger = new Logger(StoryController.name);

  constructor(private storyService: StoryService) {}

  /**
   * Public Api
   * getAllStoryByShop()
   * getStoryBySlug()
   * getStoryByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllStoryByShop(
    @Body() filterStoryDto: FilterAndPaginationStoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.storyService.getAllStoryByShop(
      shop,
      filterStoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getStoryBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.storyService.getStoryBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-storys-by-ids')
  async getStoryByIds(
    @Body() getStoryByIdsDto: GetStoryByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.storyService.getStoryByIds(
      shop,
      getStoryByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addStory()
   * getStoryById()
   * updateStoryById()
   * updateMultipleStoryById()
   * deleteMultipleStoryByIdByVendor()
   * deleteMultipleTrashStory()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addStory(
    @Body()
    addStoryDto: AddStoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.storyService.addStory(req.user, addStoryDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getStoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.storyService.getStoryById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateStoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.storyService.updateStoryById(
      req.user,
      shop,
      id,
      updateStoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleStoryById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.storyService.updateMultipleStoryById(
      req.user,
      shop,
      updateStoryDto.ids,
      updateStoryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleStoryByIdByVendor(
    @Body() deleteStoryDto: DeleteStoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.storyService.deleteMultipleStoryByIdByVendor(
      req.user,
      shop,
      deleteStoryDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashStory(
    @Body() deleteStoryDto: DeleteStoryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.storyService.deleteMultipleTrashStory(
      req.user,
      shop,
      deleteStoryDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllStorys()
   * deleteMultipleStoryById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllStorys(
    @Body() filterStoryDto: FilterAndPaginationStoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.storyService.getAllStorys(filterStoryDto, searchString);
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
  async deleteMultipleStoryById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.storyService.deleteMultipleStoryById(data.ids);
  }
}
