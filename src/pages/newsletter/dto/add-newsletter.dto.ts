import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AddNewsletterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
