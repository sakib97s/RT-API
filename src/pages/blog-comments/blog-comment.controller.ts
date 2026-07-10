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
import { BlogCommentService } from './blog-comment.service';
import {
  AddBlogCommentDto,
  DeleteBlogCommentDto,
  FilterAndPaginationBlogCommentDto,
  GetBlogCommentByIdsDto,
  UpdateBlogCommentDto,
} from './dto/blog-comment.dto';
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
import { UserAuthGuard } from '../user/guards/user-auth.guard';

@Controller('comment')
export class BlogCommentController {
  private logger = new Logger(BlogCommentController.name);

  constructor(private blogCommentService: BlogCommentService) {}

  /**
   * Public Api
   * getAllBlogCommentByShop()
   * getBlogCommentBySlug()
   * getBlogCommentByIds()
   */
  @Get('/get-blogComment')
  @UsePipes(ValidationPipe)
  async getAllCarouselForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.getBlogCommentForUi(shop);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllBlogCommentByShop(
    @Body() filterBlogCommentDto: FilterAndPaginationBlogCommentDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.getAllBlogCommentByShop(
      shop,
      filterBlogCommentDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getBlogCommentBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.getBlogCommentBySlug(
      shop,
      slug,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-blogComments-by-ids')
  async getBlogCommentByIds(
    @Body() getBlogCommentByIdsDto: GetBlogCommentByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.getBlogCommentByIds(
      shop,
      getBlogCommentByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addBlogComment()
   * getBlogCommentById()
   * updateBlogCommentById()
   * updateMultipleBlogCommentById()
   * deleteMultipleBlogCommentByIdByVendor()
   * deleteMultipleTrashBlogComment()
   */

  @Post('/add')
  @UseGuards(VendorAuthGuard)
  async addBlogComment(
    @Body()
    addBlogCommentDto: AddBlogCommentDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.addBlogComment(
      req.user,
      shop,
      addBlogCommentDto,
    );
  }

  @Post('/add-by-user')
  @UseGuards(UserAuthGuard)
  async addBlogCommentByUser(
    @Body()
    addBlogCommentDto: AddBlogCommentDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.addBlogCommentByUser(
      req.user,
      shop,
      addBlogCommentDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getBlogCommentById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.getBlogCommentById(
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
  async updateBlogCommentById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBlogCommentDto: UpdateBlogCommentDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.updateBlogCommentById(
      req.user,
      shop,
      id,
      updateBlogCommentDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleBlogCommentById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateBlogCommentDto: UpdateBlogCommentDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.updateMultipleBlogCommentById(
      req.user,
      shop,
      updateBlogCommentDto.ids,
      updateBlogCommentDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleBlogCommentByIdByVendor(
    @Body() deleteBlogCommentDto: DeleteBlogCommentDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.deleteMultipleBlogCommentByIdByVendor(
      req.user,
      shop,
      deleteBlogCommentDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashBlogComment(
    @Body() deleteBlogCommentDto: DeleteBlogCommentDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.deleteMultipleTrashBlogComment(
      req.user,
      shop,
      deleteBlogCommentDto.ids,
    );
  }

  /**
   * Admin Secure Api
   * getAllBlogComments()
   * deleteMultipleBlogCommentById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllBlogComments(
    @Body() filterBlogCommentDto: FilterAndPaginationBlogCommentDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.blogCommentService.getAllBlogComments(
      filterBlogCommentDto,
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
  async deleteMultipleBlogCommentById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.blogCommentService.deleteMultipleBlogCommentById(
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
    return await this.blogCommentService.deleteAllTrashByShop(shop);
  }
}
