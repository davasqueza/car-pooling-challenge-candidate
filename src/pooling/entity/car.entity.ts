import { CarDto } from '../dto/car.dto';

export interface StoredCar extends CarDto {
  free: number;
}
