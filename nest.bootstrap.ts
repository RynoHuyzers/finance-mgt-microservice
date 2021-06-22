import { HttpExceptionFilter } from './HttpExceptionFilter';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { eventContext } from 'aws-serverless-express/middleware';
import {ExpressAdapter} from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

export const bootstrapNest = async (expressServer) => {
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
        ],
    };

    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressServer));
    nestApp.useGlobalFilters(new HttpExceptionFilter());
    nestApp.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            validateCustomDecorators: true,
        }),
    );
    nestApp.enableCors(corsOptions);
    nestApp.use(eventContext());

    return nestApp;
}