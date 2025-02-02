import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import * as rfs from 'rotating-file-stream';
import { AllExceptionsFilter } from './middleware/exception/http.exception.filter';
import { TransformInterceptor } from './middleware/interceptor/transform.interceptor';
import path = require('path');
import { API_PORT } from './shared/helper/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('api');
  app.enableCors();

  const accessLogStream = rfs.createStream('access.log', {
    maxSize: '10M',
    size: '10M',
    interval: '1d', // rotate daily
    path: path.join(process.cwd(), 'logs'),
  });
  app.use(morgan('combined', { stream: accessLogStream }));

  const options = new DocumentBuilder()
    .setTitle('base')
    .setDescription('api')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(API_PORT);
  console.log('service listen on port', API_PORT);
}
bootstrap();
