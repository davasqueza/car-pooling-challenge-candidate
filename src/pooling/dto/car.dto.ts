import { IsNumber, Min } from 'class-validator';

export class CarDto {
  @IsNumber()
  id: number;

  @IsNumber()
  @Min(0)
  seats: number;
}
