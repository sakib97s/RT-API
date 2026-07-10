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

import {
  AddTutorialDto,
  FilterAndPaginationTutorialDto,
  InsertManyTutorialDto,
  UpdateTutorialDto,
} from './dto/tutorial.dto';

import { AdminMetaRoles } from 'src/pages/admin/decorator/admin-roles.decorator';
import { AdminRolesGuard } from 'src/pages/admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/pages/admin/decorator/admin-permissions.decorator';
import { AdminPermissionGuard } from 'src/pages/admin/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { TutorialService } from './tutorial.service';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { FilterAndPaginationSeoDto } from '../seo/dto/seo.dto';

@Controller('tutorial')
export class TutorialController {
  private logger = new Logger(TutorialController.name);

  constructor(private tutorialService: TutorialService) {}

  /**
   * Public Api
   * getAllTutorialByShop()
   * getTutorialBySlug()
   * getTutorialByIds()
   */
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllTutorialByShop(
    @Body() filterTutorialDto: FilterAndPaginationTutorialDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.getAllTutorialByShop(
      shop,
      filterTutorialDto,
      searchString,
    );
  }

  @Post('/get-all-by-clint-shop')
  @UsePipes(ValidationPipe)
  async getAllTutorialByClintShop(
    @Body() filterTutorialDto: FilterAndPaginationTutorialDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.getAllTutorialByClintShop(
      shop,
      filterTutorialDto,
      searchString,
    );
  }
  /**
   * addTutorial()
   * insertManyTutorial()
   * getAllTutorials()
   * getTutorialById()
   * updateTutorialById()
   * updateMultipleTutorialById()
   * deleteTutorialById()
   * deleteMultipleTutorialById()
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  // @AdminMetaRoles(
  //   AdminRoles.SUPER_ADMIN,
  //   AdminRoles.SUPER_ADMIN,
  //   AdminRoles.EDITOR,
  // )
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.CREATE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminAuthGuard)
  async addTutorial(
    @Body()
    addTutorialDto: AddTutorialDto,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.addTutorial(addTutorialDto);
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
    body: InsertManyTutorialDto,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.insertManyTutorial(body.data);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.GET)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async getAllTutorials(
    @Body() filterTutorialDto: FilterAndPaginationTutorialDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.tutorialService.getAllTutorials(
      filterTutorialDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getTutorialById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.getTutorialById(id, select);
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
  async updateTutorialById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateTutorialDto: UpdateTutorialDto,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.updateTutorialById(id, updateTutorialDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async updateMultipleTutorialById(
    @Body() updateTutorialDto: UpdateTutorialDto,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.updateMultipleTutorialById(
      updateTutorialDto.ids,
      updateTutorialDto,
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
  async deleteTutorialById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.tutorialService.deleteTutorialById(id);
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
  async deleteMultipleTutorialById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.tutorialService.deleteMultipleTutorialById(data.ids);
  }
}
