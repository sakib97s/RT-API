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
import { UserService } from './user.service';

import {
  AddAddressDto,
  AuthUserDto,
  CheckUserDto,
  CreateUserDto,
  DeleteUserDto,
  FilterAndPaginationUserDto,
  GetUserByIdsDto,
  ResetUserPasswordDto,
  UpdateAddressDto,
  UpdateUserDto,
  UserSelectFieldDto,
} from './dto/user.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { UserAuthResponse } from './interfaces/user.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { UserAuthGuard } from './guards/user-auth.guard';
import { AdminMetaRoles } from '../admin/decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from '../admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from '../admin/guards/admin-permission.guard';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';

@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(private userService: UserService) {}

  /**
   * Public Api
   * getAllUserByShop()
   * getUserBySlug()
   * getUserByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllUserByShop(
    @Body() filterUserDto: FilterAndPaginationUserDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.userService.getAllUserByShop(
      shop,
      filterUserDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getUserBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.userService.getUserBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-users-by-ids')
  async getUserByIds(
    @Body() getUserByIdsDto: GetUserByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userService.getUserByIds(shop, getUserByIdsDto, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-users-data-by-phone-no')
  async getUserDataByPhoneNo(
    @Body() getUserByIdsDto: GetUserByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userService.getUserDataByPhoneNo(
      shop,
      getUserByIdsDto,
      select,
    );
  }

  /**
   * checkUserWithPhoneNo()
   * userSignup()
   * userLogin()
   * userSignupAndLogin()
   * getLoggedInUserData()
   * getAllUsers()
   * getUserById()
   * updateLoggedInUserInfo()
   * changeLoggedInUserPassword()
   * updateUserById()
   * updateMultipleUserById()
   * deleteUserById()
   * deleteMultipleUserById()
   */

  @Post('/check-user-with-phone-no')
  @UsePipes(ValidationPipe)
  async checkUserWithPhoneNo(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    checkUserDto: CheckUserDto,
  ): Promise<ResponsePayload> {
    return await this.userService.checkUserWithPhoneNo(
      shop,
      checkUserDto,
      true,
    );
  }

  @Post('/check-user-with-phone-no-or-email-for-reset-password')
  @UsePipes(ValidationPipe)
  async checkUserWithPhoneNoForResetPassword(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    checkUserDto: CheckUserDto,
  ): Promise<ResponsePayload> {
    return await this.userService.checkUserWithPhoneNoForResetPassword(
      shop,
      checkUserDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/reset-user-password')
  @UsePipes(ValidationPipe)
  async resetUserPassword(
    @Body() resetUserPasswordDto: ResetUserPasswordDto,
  ): Promise<ResponsePayload> {
    return await this.userService.resetUserPassword(resetUserPasswordDto);
  }

  @Post('/signup')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async userSignup(
    @Body()
    createUserDto: CreateUserDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userService.userSignup(shop, createUserDto);
  }

  @Post('/user-signup-vendor')
  @UseGuards(VendorAuthGuard)
  async userSignupVendor(
    @Body()
    createUserDto: CreateUserDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userService.userSignup(shop, createUserDto);
  }

  @Post('/login')
  @UsePipes(ValidationPipe)
  async userLogin(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() authUserDto: AuthUserDto,
  ): Promise<UserAuthResponse> {
    authUserDto.shop = shop;
    return await this.userService.userLogin(authUserDto);
  }

  @Post('/signup-and-login')
  @UsePipes(ValidationPipe)
  async userSignupAndLogin(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    createUserDto: CreateUserDto,
  ): Promise<ResponsePayload> {
    return await this.userService.userSignupAndLogin(shop, createUserDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/logged-in-user-data')
  @UseGuards(UserAuthGuard)
  async getLoggedInUserData(
    @Query(ValidationPipe) userSelectFieldDto: UserSelectFieldDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.userService.getLoggedInUserData(req.user, userSelectFieldDto);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/all-users')
  @UsePipes(ValidationPipe)
  async getAllUsers(
    @Body() filterUserDto: FilterAndPaginationUserDto,
    @Query('q') searchString?: string,
  ): Promise<ResponsePayload> {
    return this.userService.getAllUsers(filterUserDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by/:id')
  @UsePipes(ValidationPipe)
  async getUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query(ValidationPipe) userSelectFieldDto: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    return await this.userService.getUserById(id, userSelectFieldDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-phone/:phoneNo')
  @UsePipes(ValidationPipe)
  async getUserByPhoneNo(
    @Param('phoneNo') phoneNo: string,
    @Query(ValidationPipe) userSelectFieldDto: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    return await this.userService.getUserByPhoneNo(phoneNo, userSelectFieldDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-logged-in-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateLoggedInUserInfo(
    @Req() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponsePayload> {
    return await this.userService.updateLoggedInUserInfo(
      req.user,
      updateUserDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/change-logged-in-user-password')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async changeLoggedInUserPassword(
    @Req() res: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ResponsePayload> {
    return await this.userService.changeLoggedInUserPassword(
      res.user,
      changePasswordDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-user/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponsePayload> {
    return await this.userService.updateUserById(id, updateUserDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-vendor-user/:id')
  @UseGuards(VendorAuthGuard)
  async updateVendorUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponsePayload> {
    return await this.userService.updateUserById(id, updateUserDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-user-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleUserById(
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponsePayload> {
    return await this.userService.updateMultipleUserById(
      updateUserDto.ids,
      updateUserDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleUserByIds(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userService.updateMultipleUserByIds(
      req.user,
      shop,
      updateUserDto.ids,
      updateUserDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-user/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteUserById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.userService.deleteUserById(id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-user-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleUserById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.userService.deleteMultipleUserById(data.ids);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleUserByIdByVendor(
    @Body() deleteUserDto: DeleteUserDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userService.deleteMultipleUserByIdByVendor(
      req.user,
      shop,
      deleteUserDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-user')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleUsersByIdByVendor(
    @Body() deleteUserDto: DeleteUserDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userService.deleteMultipleUsersByIdByVendor(
      req.user,
      shop,
      deleteUserDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/add-address')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addNewAddress(
    @Req() req: any,
    @Body() addAddressDto: AddAddressDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userService.addNewAddress(shop, req.user, addAddressDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-user-address')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllAddress(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userService.getAllAddress(shop, req.user);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/edit-address/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateAddressById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.userService.updateAddressById(
      shop,
      req.user,
      id,
      updateAddressDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-address/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async deleteAddressById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.userService.deleteAddressById(shop, req.user, id);
  }

  @Post('verify-google-login')
  async verifyGoogleLoginWithToken(
    @Body('token') token: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ) {
    return await this.userService.verifyGoogleLoginWithToken(shop, token);
  }
}
