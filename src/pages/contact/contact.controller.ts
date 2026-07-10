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

import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { AdminMetaRoles } from '../admin/decorator/admin-roles.decorator';
import { AdminRoles } from 'src/enum/admin-roles.enum';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from '../admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from 'src/enum/admin-permission.enum';
import { AdminPermissionGuard } from '../admin/guards/admin-permission.guard';

import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { ContactService } from './contact.service';
import {
  AddContactDto,
  FilterAndPaginationContactDto,
  InsertManyContactDto,
  UpdateContactDto,
} from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  private logger = new Logger(ContactController.name);

  constructor(private contactService: ContactService) {}

  /**
   * addContact()
   * insertManyContact()
   * getAllContacts()
   * getAllContactsBasic()
   * getContactById()
   * updateContactById()
   * updateMultipleContactById()
   * deleteContactById()
   * deleteMultipleContactById()
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  async addContact(
    @Body()
    addcontactDto: AddContactDto,
  ): Promise<ResponsePayload> {
    return await this.contactService.addContact(addcontactDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async insertManyContact(
    @Body()
    body: InsertManyContactDto,
  ): Promise<ResponsePayload> {
    return await this.contactService.insertManyContact(body.data, body.option);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllContacts(
    @Body() filterContactDto: FilterAndPaginationContactDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.contactService.getAllContacts(filterContactDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-basic')
  async getAllContactsBasic(): Promise<ResponsePayload> {
    return await this.contactService.getAllContactsBasic();
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by/:id')
  async getContactById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.contactService.getContactById(id, select);
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
  async updateContactById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<ResponsePayload> {
    return await this.contactService.updateContactById(id, updateContactDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleContactById(
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<ResponsePayload> {
    return await this.contactService.updateMultipleContactById(
      updateContactDto.ids,
      updateContactDto,
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
  async deleteContactById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.contactService.deleteContactById(id, Boolean(checkUsage));
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
  async deleteMultipleContactById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.contactService.deleteMultipleContactById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
