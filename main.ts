import { HttpExceptionFilter } from './HttpExceptionFilter';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import {ExpressAdapter} from '@nestjs/platform-express';

async function bootstrap() {
  const corsOptions = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Amz-Cf-IdX-Amz-Date',
      'x-amzn-RequestId',
      'X-Amzn-Trace-Id',
      'X-Api-Key',
      'X-Cache',
      'startAtKey',
      'userid',
      'system',
      'eventid',
      'eventts',
      'clientid'
    ],
  };

  try {
    const expressServer = express();
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressServer),
        {logger: process.env.LOG_LEVEL === 'DEBUG' ? ['log', 'error', 'warn', 'debug']: ['log', 'error', 'warn']}
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors(corsOptions);
    await app.listen(3000);
  }
  catch (e) {
    console.log(e);
  }

}
bootstrap();
