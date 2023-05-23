import { HealthCheckError } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { HealthIndicator } from '@nestjs/terminus';
import * as loopbench from 'loopbench';
/**
 * Checks the event loop usage.
 */
@Injectable()
export class EventLoopIndicator extends HealthIndicator {
  private readonly eventLoop: loopbench.LoopBench = null;

  constructor() {
    super();
    this.eventLoop = loopbench({ limit: 700 });
  }
  /**
   * Checks the system CPU load.
   *
   * @param key The key which will be used for the result object
   */
  public check(key: string) {
    const healthy = !this.eventLoop.overLimit;
    const eventLoopStats = {
      delay: this.eventLoop.delay,
      limit: this.eventLoop.limit,
    };
    const status = super.getStatus(key, healthy, eventLoopStats);
    if (!healthy) {
      throw new HealthCheckError(
        'event loop delay is above the threshold',
        status,
      );
    }
    return status;
  }
}
