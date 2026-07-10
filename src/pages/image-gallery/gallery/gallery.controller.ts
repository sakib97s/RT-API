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
import { GalleryService } from './gallery.service';
import { MongoIdValidationPipe } from '../../../pipes/mongo-id-validation.pipe';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { AdminMetaRoles } from 'src/decorator/admin-roles.decorator';
import { AdminRoles } from '../../../enum/admin-roles.enum';
import { AdminRolesGuard } from 'src/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../../enum/admin-permission.enum';
import { AdminPermissionGuard } from 'src/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import {
  AddGalleryDto,
  FilterAndPaginationGalleryDto,
  InsertManyGalleryDto,
  UpdateGalleryDto,
} from './dto/gallery.dto';
import { VendorAuthGuard } from '../../vendor/guards/vendor-auth.guard';

@Controller('gallery')
export class GalleryController {
  private logger = new Logger(GalleryController.name);

  constructor(private galleryService: GalleryService) {}

  /**
   * Admin Secure Api
   * addGallery()
   * insertManyGallery()
   * getAllGallerys()
   * getGalleryById()
   * updateGalleryById()
   * updateMultipleGalleryById()
   * deleteGalleryById()
   * deleteMultipleGalleryById()
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
  async addGallery(
    @Body()
    addGalleryDto: AddGalleryDto,
  ): Promise<ResponsePayload> {
    return await this.galleryService.addGallery(addGalleryDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.SUPER_ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.CREATE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminAuthGuard)
  async insertManyGallery(
    @Body()
    body: InsertManyGalleryDto,
  ): Promise<ResponsePayload> {
    return await this.galleryService.insertManyGallery(body.data, body.option);
  }

  @Post('/insert-many-admin')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.SUPER_ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.CREATE)
  // @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async insertManyAdminGallery(
    @Body()
    body: InsertManyGalleryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.galleryService.insertManyAdminGallery(
      req.user._id,
      body.data,
      body.option,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllGallerys(
    @Body() filterGalleryDto: FilterAndPaginationGalleryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    filterGalleryDto.filter = {
      ...filterGalleryDto.filter,
      ...{ shop: { $eq: null } },
    };

    return this.galleryService.getAllGallerys(filterGalleryDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-admin')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  async getAllAdminGallerys(
    @Body() filterGalleryDto: FilterAndPaginationGalleryDto,
    @Query('q') searchString: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    filterGalleryDto.filter = {
      ...filterGalleryDto.filter,
      ...{ admin: req.user._id },
    };
    console.log('req.user', req.user);
    return this.galleryService.getAllAdminGallerys(
      filterGalleryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by/:id')
  async getGalleryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.galleryService.getGalleryById(id, select);
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
  async updateGalleryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
  ): Promise<ResponsePayload> {
    return await this.galleryService.updateGalleryById(id, updateGalleryDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleGalleryById(
    @Body() updateGalleryDto: UpdateGalleryDto,
  ): Promise<ResponsePayload> {
    return await this.galleryService.updateMultipleGalleryById(
      updateGalleryDto.ids,
      updateGalleryDto,
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
  async deleteGalleryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.galleryService.deleteGalleryById(id);
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
  async deleteMultipleGalleryById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.galleryService.deleteMultipleGalleryById(data.ids);
  }

  /**
   * Vendor Secure Api
   * addGalleryByShop()
   * getAllFolderByShop()
   * updateGalleryByIdByShop()
   * deleteMultipleGalleryByIdByShop()
   */

  @Post('/add-gallery-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addGalleryByVendor(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() addGalleryDto: AddGalleryDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.galleryService.addGalleryByShop(
      shop,
      req.user,
      addGalleryDto,
    );
  }

  @Post('/insert-many-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async insertManyGalleryByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    body: InsertManyGalleryDto,
  ): Promise<ResponsePayload> {
    return await this.galleryService.insertManyGalleryByShop(shop, body.data);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllFolderByShop(
    @Body() filterGalleryDto: FilterAndPaginationGalleryDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.galleryService.getAllFolderByShop(
      shop,
      req.user,
      filterGalleryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-by-shop/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateGalleryByIdByShop(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.galleryService.updateGalleryByIdByShop(
      req.user,
      shop,
      id,
      updateGalleryDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleGalleryByIdByShop(
    @Body() data: { ids: string[] },
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.galleryService.deleteMultipleGalleryByIdByShop(
      req.user,
      shop,
      data.ids,
    );
  }
}
