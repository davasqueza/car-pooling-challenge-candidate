import { HealthCheckError } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { HealthIndicator } from '@nestjs/terminus';
import * as os from 'os';

@Injectable()
export class SystemCPUIndicator extends HealthIndicator {
  /**
   * Checks the system CPU load.
   *
   * This checks the cpu load average over one minute, weighted over
   * the amount of cores, so a load of 1 represents an average of 100%
   * load over the whole cpu.
   *
   * @param key The key which will be used for the result object
   * @param maxLoad (optional, default: 3) Max load to tolerate before failing
   */
  public check(key: string, maxLoad: number = 3) {
    const cpuLoad = os.loadavg();
    const weightedLoad = cpuLoad[0] / os.cpus().length;

    const healthy = weightedLoad < maxLoad;
    const status = super.getStatus(key, healthy, {
      loadavg: cpuLoad,
      weightedLoad,
      threshold: maxLoad,
    });
    if (!healthy) {
      throw new HealthCheckError('cpu load is above threshold', status);
    }
    return status;
  }
}
