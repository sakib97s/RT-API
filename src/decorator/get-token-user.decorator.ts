import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/pages/user/interfaces/user.interface';



export const GetTokenUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
