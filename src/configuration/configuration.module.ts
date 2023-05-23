import { AppConfigurationService } from './app-configuration.service';
import { ConfigModule } from '@nestjs/config';
import { DynamicModule } from '@nestjs/common';

export class ConfigurationModule {
  static forRoot(): DynamicModule {
    return {
      module: ConfigurationModule,
      global: true,
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [
        AppConfigurationService,
      ],
      exports: [
        AppConfigurationService,
      ],
    };
  }
}
