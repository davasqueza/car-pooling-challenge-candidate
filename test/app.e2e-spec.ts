import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Car pooling (e2e)', () => {
  let app: INestApplication;
  const car = { id: 1, seats: 4 };
  const group2 = { id: 1, people: 2 };
  const group3 = { id: 2, people: 3 };
  const group5 = { id: 3, people: 5 };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({
      forbidNonWhitelisted: true,
    }));

    await app.init();
  });

  describe('Service health', () => {
    it('should return current server status', () => {
      return request(app.getHttpServer())
        .get('/status')
        .expect(200)
        .then(response => {
          expect(response.body.status).toBe('ok');
        });
    });
  });


  describe('Basic endpoint request/response validations', () => {
    describe('Cars endpoint', () => {
      it('should accept a valid list of cars', () => {
        return request(app.getHttpServer())
          .put('/cars')
          .send([ car ])
          .expect(200);
      });

      it('should reject an invalid list of cars', () => {
        const invalidData = [
          {
            id: 'invalid',
            seats: 'invalid',
          }
        ];

        return request(app.getHttpServer())
          .put('/cars')
          .send(invalidData)
          .expect(400);
      });
    });

    describe('Journey endpoint', () => {
      it('should accept a valid group of people', () => {
        return request(app.getHttpServer())
          .post('/journey')
          .send(group3)
          .expect(200);
      });

      it('should reject an invalid group of people', () => {
        const invalidData = {
          id: 'invalid',
          seats: 'invalid',
        };

        return request(app.getHttpServer())
          .post('/journey')
          .send(invalidData)
          .expect(400);
      });
    });

    describe('Drop off endpoint', () => {
      it('should accept a valid drop off', async () => {
        const validData = {
          ID: group3.id,
        };

        await request(app.getHttpServer())
          .post('/journey')
          .send(group3)
          .expect(200);

        return request(app.getHttpServer())
          .post('/dropoff')
          .type('form')
          .send(validData)
          .expect(200);
      });

      it('should reject an invalid drop off', () => {
        const invalidData = {
            ID: 'invalid',
        };

        return request(app.getHttpServer())
          .post('/dropoff')
          .type('form')
          .send(invalidData)
          .expect(400);
      });
    });

    describe('Locate endpoint', () => {
      it('should accept a valid locate', async () => {
        const validData = {
          ID: group3.id,
        };

        await request(app.getHttpServer())
          .post('/journey')
          .send(group3)
          .expect(200);

        return request(app.getHttpServer())
          .post('/locate')
          .type('form')
          .send(validData)
          .then(result => {
            expect([200, 204]).toContain(result.status);
          });
      });

      it('should handle location of groups not registered', () => {
        const validData = {
          ID: group3.id,
        };

        return request(app.getHttpServer())
          .post('/locate')
          .type('form')
          .send(validData)
          .expect(404);
      });

      it('should reject an invalid locate', () => {
        const invalidData = {
          ID: 'invalid',
        };

        return request(app.getHttpServer())
          .post('/locate')
          .type('form')
          .send(invalidData)
          .expect(400);
      });
    });
  });

  describe('Basic car assignation', () => {
    it('should assign a group to an available car', async () => {
      await request(app.getHttpServer())
        .put('/cars')
        .send([ car ])
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group3)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group3.id })
        .expect(200);

      expect(response.body.id).toBe(car.id);
      expect(response.body.seats).toBe(car.seats);
    });

    it('should make wait a group when there is no cars available', async () => {
      await request(app.getHttpServer())
        .put('/cars')
        .send([ ])
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group3)
        .expect(200);

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group3.id })
        .expect(204);
    });

    it('should assign a released car to a waiting group when it has capacity', async () => {
      await request(app.getHttpServer())
        .put('/cars')
        .send([ car ])
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group3)
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group2)
        .expect(200);

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group3.id })
        .expect(200)
        .then(response => {
          expect(response.body.id).toBe(car.id);
          expect(response.body.seats).toBe(car.seats);
        });

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group2.id })
        .expect(204);

      await request(app.getHttpServer())
        .post('/dropoff')
        .type('form')
        .send({ ID: group3.id })
        .expect(200);

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group2.id })
        .expect(200)
        .then(response => {
          expect(response.body.id).toBe(car.id);
          expect(response.body.seats).toBe(car.seats);
        });
    });

    it('should not assign a released car to a waiting group when it does not have capacity', async () => {
      await request(app.getHttpServer())
        .put('/cars')
        .send([ car ])
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group3)
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group5)
        .expect(200);

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group3.id })
        .expect(200)
        .then(response => {
          expect(response.body.id).toBe(car.id);
          expect(response.body.seats).toBe(car.seats);
        });

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group5.id })
        .expect(204);

      await request(app.getHttpServer())
        .post('/dropoff')
        .type('form')
        .send({ ID: group3.id })
        .expect(200);

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group5.id })
        .expect(204);
    });

    it('should assign a car to a lower priority group when a higher priority group cannot be served', async () => {
      await request(app.getHttpServer())
        .put('/cars')
        .send([ car ])
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group5)
        .expect(200);

      await request(app.getHttpServer())
        .post('/journey')
        .send(group3)
        .expect(200);

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group5.id })
        .expect(204);

      await request(app.getHttpServer())
        .post('/locate')
        .type('form')
        .send({ ID: group3.id })
        .expect(200)
        .then(response => {
          expect(response.body.id).toBe(car.id);
          expect(response.body.seats).toBe(car.seats);
        });
    });
  });
});
