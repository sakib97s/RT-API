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
import { FileFolderService } from './file-folder.service';
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
  AddFileFolderDto,
  FilterAndPaginationFileFolderDto,
  InsertManyFileFolderDto,
  UpdateFileFolderDto,
} from './dto/file-folder.dto';
import { VendorAuthGuard } from '../../vendor/guards/vendor-auth.guard';

@Controller('file-folder')
export class FileFolderController {
  private logger = new Logger(FileFolderController.name);

  constructor(private fileFolderService: FileFolderService) {}

  /**
   * Admin Secure Api
   * addFileFolder()
   * insertManyFileFolder()
   * getAllFileFolders()
   * getFileFolderById()
   * updateFileFolderById()
   * updateMultipleFileFolderById()
   * deleteFileFolderById()
   * deleteMultipleFileFolderById()
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
  async addFileFolder(
    @Body()
    addFileFolderDto: AddFileFolderDto,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.addFileFolder(addFileFolderDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async insertManyFileFolder(
    @Body()
    body: InsertManyFileFolderDto,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.insertManyFileFolder(
      body.data,
      body.option,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllFileFolders(
    @Body() filterFileFolderDto: FilterAndPaginationFileFolderDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    filterFileFolderDto.filter = {
      ...filterFileFolderDto.filter,
      ...{ shop: { $eq: null } },
    };

    return this.fileFolderService.getAllFileFolders(
      filterFileFolderDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-admin')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  async getAllAdminFileFolders(
    @Body() filterFileFolderDto: FilterAndPaginationFileFolderDto,
    @Query('q') searchString: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    filterFileFolderDto.filter = {
      ...filterFileFolderDto.filter,
      ...{ admin: req.user._id },
    };
    return this.fileFolderService.getAllAdminFileFolders(
      filterFileFolderDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by/:id')
  async getFileFolderById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.getFileFolderById(id, select);
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
  async updateFileFolderById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateFileFolderDto: UpdateFileFolderDto,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.updateFileFolderById(
      id,
      updateFileFolderDto,
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
  async updateMultipleFileFolderById(
    @Body() updateFileFolderDto: UpdateFileFolderDto,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.updateMultipleFileFolderById(
      updateFileFolderDto.ids,
      updateFileFolderDto,
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
  async deleteFileFolderById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.deleteFileFolderById(id);
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
  async deleteMultipleFileFolderById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.deleteMultipleFileFolderById(data.ids);
  }

  /**
   * Vendor Secure Api
   * addFileFolderByShop()
   * getAllFolderByShop()
   * updateFileFolderByIdByShop()
   * deleteMultipleFileFolderByIdByShop()
   */

  @Post('/add-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addFileFolderByVendor(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() addFileFolderDto: AddFileFolderDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.addFileFolderByShop(
      shop,
      req.user,
      addFileFolderDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllFolderByShop(
    @Body() filterFileFolderDto: FilterAndPaginationFileFolderDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.getAllFolderByShop(
      shop,
      req.user,
      filterFileFolderDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-by-shop/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateFileFolderByIdByShop(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateFileFolderDto: UpdateFileFolderDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.updateFileFolderByIdByShop(
      req.user,
      shop,
      id,
      updateFileFolderDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleFileFolderByIdByShop(
    @Body() data: { ids: string[] },
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.fileFolderService.deleteMultipleFileFolderByIdByShop(
      req.user,
      shop,
      data.ids,
    );
  }
}
