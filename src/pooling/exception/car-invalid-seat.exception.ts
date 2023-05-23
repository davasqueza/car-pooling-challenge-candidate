import { BaseException } from './base.exception';
import { CarDto } from '../dto/car.dto';

export class CarInvalidSeatException extends BaseException {
  constructor(message: string, invalidCar: CarDto) {
    super(message, 'CarInvalidSeat', invalidCar.id.toString());
  }
}
