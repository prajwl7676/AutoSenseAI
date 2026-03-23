import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; timestamp: string } {
    return {
      message: 'Hello from AutoSenseAI API!',
      timestamp: new Date().toISOString(),
    };
  }
}
