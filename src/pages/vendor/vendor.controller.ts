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
import { VendorService } from './vendor.service';
import {
  AuthVendorDto,
  CheckVendorDto,
  CreateVendorDto,
  FilterAndPaginationVendorDto,
  ResetVendorPasswordDto,
  UpdateVendorDto,
  VendorSelectFieldDto,
} from './dto/vendor.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { VendorAuthResponse } from './interfaces/vendor.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { VendorAuthGuard } from './guards/vendor-auth.guard';
import { AdminMetaRoles } from 'src/decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from 'src/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from 'src/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('vendor')
export class VendorController {
  private logger = new Logger(VendorController.name);

  constructor(private vendorService: VendorService) {}

  /**
   * checkVendorWithPhoneNo()
   * vendorSignup()
   * vendorLogin()
   * vendorSignupAndLogin()
   * getLoggedInVendorData()
   * getAllVendors()
   * getVendorById()
   * updateLoggedInVendorInfo()
   * changeLoggedInVendorPassword()
   * updateVendorById()
   * updateMultipleVendorById()
   * deleteVendorById()
   * deleteMultipleVendorById()
   */

  @Post('/check-vendor-with-phone-no')
  @UsePipes(ValidationPipe)
  async checkVendorWithPhoneNo(
    @Body()
    checkVendorDto: CheckVendorDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.vendorService.checkVendorWithPhoneNo(
      shop,
      checkVendorDto,
      true,
    );
  }

  @Post('/check-vendor-with-phone-no-for-reset-password')
  @UsePipes(ValidationPipe)
  async checkVendorWithPhoneNoForResetPassword(
    // @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    checkVendorDto: CheckVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.checkVendorWithPhoneNoForResetPassword(
      checkVendorDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/reset-vendor-password')
  @UsePipes(ValidationPipe)
  async resetVendorPassword(
    @Body() resetVendorPasswordDto: ResetVendorPasswordDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.resetVendorPassword(resetVendorPasswordDto);
  }

  /**
   * VENDOR API
   */

  @Post('/add')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addVendorByAuth(
    @Body()
    createVendorDto: CreateVendorDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.vendorService.addVendorByAuth(req.user, createVendorDto);
  }

  /**
   * Admin panel থেকে vendor তৈরি করার route
   * AdminJwtAuthGuard দিয়ে protected
   */
  @Post('/add-by-admin')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addVendorByAdmin(
    @Body()
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.vendorSignupOwner(createVendorDto);
  }

  @Post('/add-owner')
  @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.EDIT)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async vendorSignupOwner(
    @Body()
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.vendorSignupOwner(createVendorDto);
  }

  @Post('/login')
  @UsePipes(ValidationPipe)
  async vendorLogin(
    @Body() authVendorDto: AuthVendorDto,
  ): Promise<VendorAuthResponse> {
    return await this.vendorService.vendorLogin(authVendorDto);
  }

  @Post('/admin-login')
  @UsePipes(ValidationPipe)
  @UseGuards(AdminAuthGuard)
  async adminLoginOfVendorPanel(
    @Body() authVendorDto: AuthVendorDto,
  ): Promise<VendorAuthResponse> {
    return await this.vendorService.adminLoginOfVendorPanel(authVendorDto);
  }

  // @Post('/authenticate')
  // @Throttle({ default: { limit: 3, ttl: 60000 } })
  // async authenticate(@Body('token') token: any) {
  //   return this.vendorService.authenticateVendor(token);
  // }

  @Post('/authenticate')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async authenticate(
    @Body('token') token: string,
    @Query('secret') secret: string,
  ) {
    return this.vendorService.authenticateVendor(token, secret);
  }

  @Post('/signup-and-login')
  @UsePipes(ValidationPipe)
  async vendorSignupAndLogin(
    @Body()
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.vendorSignupAndLogin(createVendorDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/logged-in-vendor-data')
  @UseGuards(VendorAuthGuard)
  async getLoggedInVendorData(
    @Query(ValidationPipe) vendorSelectFieldDto: VendorSelectFieldDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.vendorService.getLoggedInVendorData(
      req.user,
      vendorSelectFieldDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/all-vendors-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllVendorsByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() filterVendorDto: FilterAndPaginationVendorDto,
    @Query('q') searchString: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.vendorService.getAllVendorsByShop(
      shop,
      req.user,
      filterVendorDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/all-vendors')
  @UsePipes(ValidationPipe)
  async getAllVendors(
    @Body() filterVendorDto: FilterAndPaginationVendorDto,
    @Query('q') searchString?: string,
  ): Promise<ResponsePayload> {
    return this.vendorService.getAllVendors(filterVendorDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by/:id')
  @UsePipes(ValidationPipe)
  async getVendorById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query(ValidationPipe) vendorSelectFieldDto: VendorSelectFieldDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.getVendorById(id, vendorSelectFieldDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-logged-in-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateLoggedInVendorInfo(
    @Req() req: any,
    @Body() updateVendorDto: UpdateVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.updateLoggedInVendorInfo(
      req.user,
      updateVendorDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/change-logged-in-vendor-password')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async changeLoggedInVendorPassword(
    @Req() res: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.changeLoggedInVendorPassword(
      res.user,
      changePasswordDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-vendor/:id')
  @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.EDIT)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminJwtAuthGuard)
  @UseGuards(VendorAuthGuard)
  async updateVendorById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.updateVendorById(id, updateVendorDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-vendor-by-admin/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  // @UseGuards(VendorAuthGuard)
  async updateVendorByAdminId(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.updateVendorById(id, updateVendorDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-vendor-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleVendorById(
    @Body() updateVendorDto: UpdateVendorDto,
  ): Promise<ResponsePayload> {
    return await this.vendorService.updateMultipleVendorById(
      updateVendorDto.ids,
      updateVendorDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-vendor/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteVendorById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.vendorService.deleteVendorById(id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-vendor-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleVendorById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.vendorService.deleteMultipleVendorById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-data')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleAdminById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.vendorService.deleteMultipleVendorById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/add-delete-vendor')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async addDeletedVendor(@Body() data: any): Promise<ResponsePayload> {
    return await this.vendorService.addDeletedVendor(data);
  }
}
