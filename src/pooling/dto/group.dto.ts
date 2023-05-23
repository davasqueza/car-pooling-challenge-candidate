import { IsNumber, Min } from 'class-validator';

export class GroupDto {
  @IsNumber()
  id: number;

  @IsNumber()
  @Min(0)
  people: number;
}
