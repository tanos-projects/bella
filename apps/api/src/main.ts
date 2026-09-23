/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as mongoose from 'mongoose';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';

import { corsOptionsDelegate } from './app/config/cors.config';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Mongoose 7 flipped this default to `false`. `AdsController`'s
  // findAllPublished/findAllByOwner pass `@Query() filter: any` straight
  // into the Mongo filter (ads-repository-nest.ts), so `true` keeps
  // stripping any query-string key that isn't an `Ad` schema field
  // instead of forwarding it to MongoDB unmodified.
  mongoose.set('strictQuery', true);
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors(corsOptionsDelegate);
  // app.useGlobalPipes(new ValidationPipe());

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();
  const config = new DocumentBuilder()
    .setTitle('Bella')
    .setDescription('')
    .setVersion('1.0')
    .addBearerAuth({ in: 'header', type: 'http' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Bella swagger',
  };
  SwaggerModule.setup(globalPrefix, app, document, customOptions);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}
bootstrap();
