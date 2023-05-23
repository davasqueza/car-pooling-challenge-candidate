import { Injectable, Logger } from '@nestjs/common';
import { PoolingRepository } from './pooling.repository';
import { GroupDto } from '../dto/group.dto';
import { CarDto } from '../dto/car.dto';
import { AppConfigurationService } from '../../configuration/app-configuration.service';
import { CarInvalidSeatException } from '../exception/car-invalid-seat.exception';
import { StoredCar } from '../entity/car.entity';
import { StoredAssignation } from '../entity/assignation.entity';

@Injectable()
export class MemoryPoolingRepository implements PoolingRepository {
  private readonly logger: Logger;

  // Map of cars stored according capacity, to allow quick search by available capacity
  private readonly availableCars: Map<StoredCar['free'], Map<StoredCar['id'], StoredCar>>;

  // Waiting list, sorted by priority
  private waiting: GroupDto[];

  // Map of assigned people groups, indexed by group id for quick location
  private readonly groupAssigned: Map<GroupDto['id'], StoredAssignation>;

  constructor(
    private appConfig: AppConfigurationService,
  ) {
    this.logger = new Logger(MemoryPoolingRepository.name);
    this.availableCars = new Map();
    this.waiting = [];
    this.groupAssigned = new Map();

    this.resetAvailableCars();
  }

  private resetAvailableCars() {
    // Reset app status
    this.availableCars.clear();
    this.waiting = [];
    this.groupAssigned.clear();

    // Initialize cars by capacity list
    for (let seats = 0; seats <= this.appConfig.maxSeats; seats++) {
      this.availableCars.set(seats, new Map());
    }
  }

  async updateCarList(cars: CarDto[]): Promise<void> {
    const minSeats = this.appConfig.minSeats;
    const maxSeats = this.appConfig.maxSeats;

    this.resetAvailableCars();

    // Store incoming cars according to their capacity
    cars.forEach(incomingCar => {
      if(incomingCar.seats < minSeats || incomingCar.seats > maxSeats) {
        throw new CarInvalidSeatException('Invalid amount of seats', incomingCar);
      }

      const car = {
        id: incomingCar.id,
        seats: incomingCar.seats,
        free: incomingCar.seats,
      };

      this.availableCars
        .get(incomingCar.seats)
        .set(incomingCar.id, car);
    });

    this.logger.debug('Updated car list', this.availableCars);
  }

  async assignPeopleGroupToCar(peopleGroup: GroupDto): Promise<CarDto | null> {
    const maxSeats = this.appConfig.maxSeats;

    // Try to search a car with available space, the search starts with exactly the amount of passengers to serve
    // a car with just the required space
    for (let capacity = peopleGroup.people; capacity <= maxSeats; capacity++) {
      const compatibleCars = this.availableCars.get(capacity);
      if(compatibleCars.size) {
        // Get first car on list
        const carId = compatibleCars.keys().next().value;
        const car = compatibleCars.get(carId);

        // Fill seats with people group
        car.free = car.free - peopleGroup.people;

        // Move car to the new available capacity according to free seats
        compatibleCars.delete(carId);
        this.availableCars.get(car.free).set(carId, car);

        // Assign group to car
        this.groupAssigned.set(peopleGroup.id, {
          car,
          people: peopleGroup.people,
        });

        return car;
      }
    }
    // No car available to serve
    this.groupAssigned.set(peopleGroup.id, {
      car: null,
      people: peopleGroup.people,
    });
    return null;
  }

  async assignPeopleGroupToWaitingList(peopleGroup: GroupDto): Promise<Boolean> {
    this.waiting.push(peopleGroup);
    return true;
  }

  async validateIfPeopleGroupExist(groupId: GroupDto['id']): Promise<Boolean> {
    return this.groupAssigned.has(groupId);
  }

  async getPeopleGroupAssignation(groupId: GroupDto['id']): Promise<CarDto | null> {
    const assignationRegister = this.groupAssigned.get(groupId);

    if (!assignationRegister?.car) { return null; }

    return {
      id: assignationRegister.car.id,
      seats: assignationRegister.car.seats,
    };
  }

  async removePeopleGroupFromCar(groupId: GroupDto['id']): Promise<CarDto | null> {
    const assignationRegister = this.groupAssigned.get(groupId);
    const assignedCar = assignationRegister?.car;

    if (!assignedCar) { return null; }

    this.availableCars
      // Car must be stored according to his free seats
      .get(assignedCar.free)
      .delete(assignedCar.id);

    // Release seats according to the amount of people dropping off
    assignedCar.free = assignedCar.free + assignationRegister.people;

    // Try to fill free seats on the car
    for (let groupIndex = 0; groupIndex < this.waiting.length && assignedCar.free > 0; groupIndex++) {
      const waitingGroup = this.waiting[groupIndex];

      if(waitingGroup.people <= assignedCar.free) {
        assignedCar.free = assignedCar.free - waitingGroup.people;

        // Assign group to car
        this.groupAssigned.set(waitingGroup.id, {
          car: assignedCar,
          people: waitingGroup.people,
        });

        // Remove group from waiting list
        this.waiting.splice(groupIndex, 1);
      }
    }

    // Register again the car according to the new free seats
    this.availableCars
      .get(assignedCar.free)
      .set(assignedCar.id, assignedCar);

    return {
      id: assignedCar.id,
      seats: assignedCar.seats,
    };
  }

  async removePeopleGroupFromWaitingList(groupId: GroupDto['id']): Promise<Boolean> {
    const groupIndex = this.waiting.findIndex(group => group.id === groupId);

    if (groupIndex === -1) { return false; }

    this.waiting.splice(groupIndex, 1);
    return true;
  }
}
