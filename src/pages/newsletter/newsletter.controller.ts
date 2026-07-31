import { Body, Controller, Delete, Param, Post, Put, Query } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { AddNewsletterDto } from './dto/add-newsletter.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('add')
  async addNewsletter(
    @Body() addNewsletterDto: AddNewsletterDto,
  ): Promise<ResponsePayload> {
    return await this.newsletterService.addNewsletter(addNewsletterDto);
  }

  @Post('get-all')
  async getAllNewsletters(
    @Body() paginate: any,
  ): Promise<ResponsePayload> {
    return await this.newsletterService.getAllNewsletters(paginate);
  }

  @Delete('delete-by-id/:id')
  async deleteNewsletterById(
    @Param('id') id: string,
  ): Promise<ResponsePayload> {
    return await this.newsletterService.deleteNewsletterById(id);
  }
}
