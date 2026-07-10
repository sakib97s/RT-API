import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
    <h1>Welcome to QA API Server</h1>
     <h4>Version 1.0.0</h4>
    <hr>
    <h4>Powered By <a href="https://softlabit.com/">Softlab IT</a></h4>
    `;
  }
}

