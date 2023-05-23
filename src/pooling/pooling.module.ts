import { Module } from '@nestjs/common';
import { PoolingController } from './controller/pooling.controller';
import { PoolingService } from './service/pooling.service';
import { PoolingRepositoryToken } from './repository/pooling.repository';
import { MemoryPoolingRepository } from './repository/memory-pooling.repository';

@Module({
  controllers: [PoolingController],
  providers: [
    PoolingService,
    {
      provide: PoolingRepositoryToken,
      useClass: MemoryPoolingRepository,
    }
  ],
})
export class PoolingModule {}
