import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  ParseIntPipe,
  Post,
  Put, Res
} from '@nestjs/common';
import { Response } from 'express';
import { CarDto } from '../dto/car.dto';
import { GroupDto } from '../dto/group.dto';
import { AcceptFormURLEncoded, AcceptJSON } from '../decorators/content-type.decorator';
import { PoolingService } from '../service/pooling.service';
import { CarInvalidSeatException } from '../exception/car-invalid-seat.exception';
import { JourneyRegistrationFailureException } from '../exception/journey-registration-failure.exception';
import { PeopleGroupNotFoundException } from '../exception/people-group-not-found.exception';

@Controller()
export class PoolingController {
  constructor(
    private poolingService: PoolingService,
  ) { }

  @Put('cars')
  @AcceptJSON()
  async updateCarList(
    @Body()
    newCars: CarDto[],
  ): Promise<void> {
    try {
      await this.poolingService.updateCarList(newCars);
    } catch (e) {
      if(e instanceof CarInvalidSeatException) {
        throw new BadRequestException({
          message: e.message,
          code: e.code,
          details: {
            carId: e.details,
          },
        });
      }

      throw new InternalServerErrorException();
    }
  }

  @Post('journey')
  @HttpCode(HttpStatus.OK)
  @AcceptJSON()
  async registerJourney(
    @Body()
    group: GroupDto,
  ): Promise<void> {
    try {
      await this.poolingService.registerJourney(group);
    } catch (e) {
      if(e instanceof JourneyRegistrationFailureException) {
        throw new InternalServerErrorException(e.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post('dropoff')
  @HttpCode(HttpStatus.OK)
  @AcceptFormURLEncoded()
  async dropOffJourney(
    @Body('ID', new ParseIntPipe())
    groupId: number,
  ): Promise<void> {
    try {
      await this.poolingService.dropOffJourney(groupId);
    } catch (e) {
      if(e instanceof PeopleGroupNotFoundException) {
        throw new NotFoundException(e.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post('locate')
  @HttpCode(HttpStatus.OK)
  @AcceptFormURLEncoded()
  async getJourneyStatus(
    @Body('ID', new ParseIntPipe())
    groupId: number,

    @Res()
    response: Response
  ): Promise<void> {
    try {
      const status = await this.poolingService.getJourneyStatus(groupId);

      if (status) {
        response
          .status(HttpStatus.OK)
          .send(status);
      } else {
        response
          .status(HttpStatus.NO_CONTENT)
          .send();
      }
    } catch (e) {
      if(e instanceof PeopleGroupNotFoundException) {
        throw new NotFoundException(e.message);
      }

      throw new InternalServerErrorException();
    }
  }
}
