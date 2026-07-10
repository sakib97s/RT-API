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
import { TagService } from './tag.service';
import {
  AddTagDto,
  DeleteTagDto,
  FilterAndPaginationTagDto,
  GetTagByIdsDto,
  UpdateTagDto,
} from './dto/tag.dto';
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

@Controller('tag')
export class TagController {
  private logger = new Logger(TagController.name);

  constructor(private tagService: TagService) {}

  /**
   * Public Api
   * getAllTagByShop()
   * getTagBySlug()
   * getTagByIds()
   */
  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllTagForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getAllTagForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllTagByShop(
    @Body() filterTagDto: FilterAndPaginationTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getAllTagByShop(
      shop,
      filterTagDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getTagBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getTagBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-tags-by-ids')
  async getTagByIds(
    @Body() getTagByIdsDto: GetTagByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.getTagByIds(shop, getTagByIdsDto, select);
  }

  /**
   * Vendor Secure Api
   * addTag()
   * getTagById()
   * updateTagById()
   * updateMultipleTagById()
   * deleteMultipleTagByIdByVendor()
   * deleteMultipleTrashTag()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addTag(
    @Body()
    addTagDto: AddTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.addTag(req.user, shop, addTagDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getTagById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.getTagById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateTagById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateTagDto: UpdateTagDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.updateTagById(
      req.user,
      shop,
      id,
      updateTagDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleTagById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateTagDto: UpdateTagDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.updateMultipleTagById(
      req.user,
      shop,
      updateTagDto.ids,
      updateTagDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTagByIdByVendor(
    @Body() deleteTagDto: DeleteTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.deleteMultipleTagByIdByVendor(
      req.user,
      shop,
      deleteTagDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashTag(
    @Body() deleteTagDto: DeleteTagDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.tagService.deleteMultipleTrashTag(
      req.user,
      shop,
      deleteTagDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllTags()
   * deleteMultipleTagById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllTags(
    @Body() filterTagDto: FilterAndPaginationTagDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.tagService.getAllTags(filterTagDto, searchString);
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
  async deleteMultipleTagById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.tagService.deleteMultipleTagById(data.ids);
  }



  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.tagService.deleteAllTrashByShop(shop);
  }
}
