import { GroupDto } from '../dto/group.dto';
import { StoredCar } from './car.entity';

export interface StoredAssignation {
  car: StoredCar;
  people: GroupDto['people'];
}
