import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigurationService {
  constructor(
    private configService: ConfigService
  ) { }

  get port() {
    return this.configService.get('PORT', 3000);
  }

  get minSeats() {
    return this.configService.get('MIN_SEATS_PER_CAR', 4);
  }

  get maxSeats() {
    return this.configService.get('MAX_SEATS_PER_CAR', 6);
  }
}
