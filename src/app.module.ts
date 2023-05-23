import { Module } from '@nestjs/common';
import { PoolingModule } from './pooling/pooling.module';
import { HealthModule } from './health/health.module';
import { ConfigurationModule } from './configuration/configuration.module';

@Module({
  imports: [
    ConfigurationModule.forRoot(),
    PoolingModule,
    HealthModule
  ],
})
export class AppModule {}
