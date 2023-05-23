import { Controller, Get } from '@nestjs/common';
import { SystemCPUIndicator } from '../services/cpu-indicator.service';
import { EventLoopIndicator } from '../services/event-loop-indicator.service';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('status')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private readonly cpu: SystemCPUIndicator,
    private readonly eventLoop: EventLoopIndicator,
    private memory: MemoryHealthIndicator,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.eventLoop.check('eventLoop'),
      () => this.cpu.check('cpu'),
      // The process should not use more than 250MB memory
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),
    ]);
  }
}
