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
import { BlogService } from './blog.service';
import {
  AddBlogDto,
  DeleteBlogDto,
  FilterAndPaginationBlogDto,
  GetBlogByIdsDto,
  UpdateBlogDto,
} from './dto/blog.dto';
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

@Controller('blog')
export class BlogController {
  private logger = new Logger(BlogController.name);

  constructor(private blogService: BlogService) {}

  /**
   * Public Api
   * getAllBlogByShop()
   * getBlogBySlug()
   * getBlogByIds()
   */

  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllBlogForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.blogService.getAllBlogForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllBlogByShop(
    @Body() filterBlogDto: FilterAndPaginationBlogDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.blogService.getAllBlogByShop(
      shop,
      filterBlogDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getBlogBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.blogService.getBlogBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/blog-view-count')
  async productViewCount(
    @Body() data: { id: string; user: string },
  ): Promise<ResponsePayload> {
    return await this.blogService.blogViewCount(data?.id, data?.user);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-blogs-by-ids')
  async getBlogByIds(
    @Body() getBlogByIdsDto: GetBlogByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.blogService.getBlogByIds(shop, getBlogByIdsDto, select);
  }

  /**
   * Vendor Secure Api
   * addBlog()
   * getBlogById()
   * updateBlogById()
   * updateMultipleBlogById()
   * deleteMultipleBlogByIdByVendor()
   * deleteMultipleTrashBlog()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addBlog(
    @Body()
    addBlogDto: AddBlogDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogService.addBlog(req.user, shop, addBlogDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getBlogById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogService.getBlogById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateBlogById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogService.updateBlogById(
      req.user,
      shop,
      id,
      updateBlogDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleBlogById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogService.updateMultipleBlogById(
      req.user,
      shop,
      updateBlogDto.ids,
      updateBlogDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleBlogByIdByVendor(
    @Body() deleteBlogDto: DeleteBlogDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogService.deleteMultipleBlogByIdByVendor(
      req.user,
      shop,
      deleteBlogDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashBlog(
    @Body() deleteBlogDto: DeleteBlogDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogService.deleteMultipleTrashBlog(
      req.user,
      shop,
      deleteBlogDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllBlogs()
   * deleteMultipleBlogById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllBlogs(
    @Body() filterBlogDto: FilterAndPaginationBlogDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.blogService.getAllBlogs(filterBlogDto, searchString);
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
  async deleteMultipleBlogById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.blogService.deleteMultipleBlogById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.blogService.deleteAllTrashByShop(shop);
  }
}
