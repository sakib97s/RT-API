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

import {
  AddSupportDto,
  FilterAndPaginationSupportDto,
  InsertManySupportDto,
  UpdateSupportDto,
} from './dto/support.dto';

import { AdminMetaRoles } from 'src/pages/admin/decorator/admin-roles.decorator';
import { AdminRolesGuard } from 'src/pages/admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/pages/admin/decorator/admin-permissions.decorator';
import { AdminPermissionGuard } from 'src/pages/admin/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { SupportService } from './support.service';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';

@Controller('support')
export class SupportController {
  private logger = new Logger(SupportController.name);

  constructor(private supportService: SupportService) {}

  /**
   * Public Api
   * getAllSupportByShop()
   * getSupportBySlug()
   * getSupportByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllSupportByShop(
    @Body() filterSupportDto: FilterAndPaginationSupportDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.supportService.getAllSupportByShop(
      shop,
      filterSupportDto,
      searchString,
    );
  }


  @Post('/get-all-by-clint-shop')
  @UsePipes(ValidationPipe)
  async getAllSupportByClintShop(
    @Body() filterSupportDto: FilterAndPaginationSupportDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.supportService.getAllSupportByShop(
      shop,
      filterSupportDto,
      searchString,
    );
  }

  /**
   * addSupport()
   * insertManySupport()
   * getAllSupports()
   * getSupportById()
   * updateSupportById()
   * updateMultipleSupportById()
   * deleteSupportById()
   * deleteMultipleSupportById()
   */
  @Post('/add-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addSupport(
    @Body()
    addSupportDto: AddSupportDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.supportService.addSupport(req.user, shop, addSupportDto);
  }

  @Post('/add-by-clint')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addSupportByClint(
    @Body()
    addSupportDto: AddSupportDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.supportService.addSupportByClint(
      req.user,
      shop,
      addSupportDto,
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
    body: InsertManySupportDto,
  ): Promise<ResponsePayload> {
    return await this.supportService.insertManySupport(body.data);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.GET)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async getAllSupports(
    @Body() filterSupportDto: FilterAndPaginationSupportDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.supportService.getAllSupports(filterSupportDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  async getSupportById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.supportService.getSupportById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-by-vendor/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateSupportByIdByVendor(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateSupportDto: UpdateSupportDto,
  ): Promise<ResponsePayload> {
    return await this.supportService.updateSupportById(id, updateSupportDto);
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
  async updateSupportById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateSupportDto: UpdateSupportDto,
  ): Promise<ResponsePayload> {
    return await this.supportService.updateSupportById(id, updateSupportDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleSupportById(
    @Body() updateSupportDto: UpdateSupportDto,
  ): Promise<ResponsePayload> {
    return await this.supportService.updateMultipleSupportById(
      updateSupportDto.ids,
      updateSupportDto,
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
  async deleteSupportById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.supportService.deleteSupportById(id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleSupportById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.supportService.deleteMultipleSupportById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleSupportByIdByVendor(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.supportService.deleteMultipleSupportById(data.ids);
  }
}
