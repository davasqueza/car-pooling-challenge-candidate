import { Injectable, Logger } from '@nestjs/common';
import { InjectPoolingRepository, PoolingRepository } from '../repository/pooling.repository';
import { CarDto } from '../dto/car.dto';
import { GroupDto } from '../dto/group.dto';
import { PeopleGroupNotFoundException } from '../exception/people-group-not-found.exception';
import { JourneyRegistrationFailureException } from '../exception/journey-registration-failure.exception';

@Injectable()
export class PoolingService {
  private readonly logger: Logger;

  constructor(
    @InjectPoolingRepository()
    private poolingRepository: PoolingRepository,
  ) {
    this.logger = new Logger(PoolingService.name);
  }

  async updateCarList(cars: CarDto[]): Promise<void> {
    this.logger.debug('Updating car list', cars);
    await this.poolingRepository.updateCarList(cars);
  }

  async registerJourney(group: GroupDto): Promise<void> {
    this.logger.log('Attempting to assign a car to group', group);

    const assignedCar = await this.poolingRepository.assignPeopleGroupToCar(group);

    if (assignedCar) { return; }

    this.logger.log(`There is no car available to assign people group ID:${group.id}`);
    const added = await this.poolingRepository.assignPeopleGroupToWaitingList(group);

    if (!added) {
      this.logger.error('Unable to register journey', group);
      throw new JourneyRegistrationFailureException('Unable to register journey', group.id);
    }
  }

  async dropOffJourney(groupId: GroupDto['id']): Promise<void> {
    await this.validatePeopleGroup(groupId);

    this.logger.log('Attempting drop-off group from car', groupId);
    const assignedCar = await this.poolingRepository.removePeopleGroupFromCar(groupId);

    if(assignedCar) { return; }

    this.logger.log('Group was not assigned to a car, attempting to remove them from waiting list', groupId);

    await this.poolingRepository.removePeopleGroupFromWaitingList(groupId);
  }

  async getJourneyStatus(groupId: GroupDto['id']): Promise<CarDto | void> {
    await this.validatePeopleGroup(groupId);
    return this.poolingRepository.getPeopleGroupAssignation(groupId);
  }

  private async validatePeopleGroup(groupId: GroupDto['id']) {
    const validGroup = await this.poolingRepository.validateIfPeopleGroupExist(groupId);

    if(!validGroup) {
      throw new PeopleGroupNotFoundException('people group not found', groupId);
    }
  }
}
