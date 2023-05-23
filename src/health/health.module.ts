import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controller/health.controller';
import { SystemCPUIndicator } from './services/cpu-indicator.service';
import { EventLoopIndicator } from './services/event-loop-indicator.service';

@Module({
  imports: [TerminusModule],
  providers: [
    SystemCPUIndicator,
    EventLoopIndicator,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
