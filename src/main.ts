import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AppConfigurationService } from './configuration/app-configuration.service';
import * as bodyParser from 'body-parser';
import { MethodNotAllowedFilter } from './configuration/method-not-allowed.filter';

async function bootstrap() {
  const isProduction = process.env.ENV === 'prod';
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['error', 'warn', 'log', 'debug'],
  });
  const appConfig = app.get(AppConfigurationService);

  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: true,
  }));
  app.use(bodyParser.json({limit: '50mb'}));
  app.useGlobalFilters(new MethodNotAllowedFilter());

  await app.listen(appConfig.port);
}
bootstrap();
