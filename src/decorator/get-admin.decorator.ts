import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Admin } from 'src/interfaces/admin.interface';

export const GetAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Admin => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin;
  },
);
