import { CarDto } from '../dto/car.dto';
import { GroupDto } from '../dto/group.dto';
import { Inject } from '@nestjs/common';

export interface PoolingRepository {
  /**
   * Update the list of available cars, removing previous assigned
   * @param cars New list of cars
   */
  updateCarList(cars: CarDto[]): Promise<void>;

  /**
   * Register a new group of people, the group will be assigned to a car if is possible
   * @param {GroupDto} peopleGroup Group to assign
   * @return {Promise<CarDto|null>} Assigned car to group or null if there is no a car available
   */
  assignPeopleGroupToCar(peopleGroup: GroupDto): Promise<CarDto | null>

  /**
   * Add a people group to the waiting list
   * @param {GroupDto} peopleGroup group to add to the waiting list
   * @return {Promise<Boolean>} Flag indicating if the operation was successful
   */
  assignPeopleGroupToWaitingList(peopleGroup: GroupDto): Promise<Boolean>;

  /**
   * Try to remove a people group from an assigned car
   * @param {GroupDto['id']} groupId group ID to remove
   * @return {Promise<CarDto|null>} Previous assigned car to group or null if the group was not assigned to a car
   */
  removePeopleGroupFromCar(groupId: GroupDto['id']): Promise<CarDto | null>;

  /**
   * Return the car assigned to a given people group
   * @param {GroupDto['id']} groupId group ID
   * @return {Promise<CarDto|null>} Assigned car to group or null if the group is not assigned to a car
   */
  getPeopleGroupAssignation(groupId: GroupDto['id']): Promise<CarDto | null>;

  /**
   * Remove a people group to the waiting list
   * @param {GroupDto['id']} groupId group ID to remove form the waiting list
   * @return {Promise<Boolean>} Flag indicating if the operation was successful
   */
  removePeopleGroupFromWaitingList(groupId: GroupDto['id']): Promise<Boolean>;

  /**
   * Validate if a people group has been registered
   * @param {GroupDto['id']} groupId group ID to validate
   */
  validateIfPeopleGroupExist(groupId: GroupDto['id']): Promise<Boolean>
}

export const PoolingRepositoryToken = Symbol('PoolingRepository');

export function InjectPoolingRepository() {
  return Inject(PoolingRepositoryToken);
}
