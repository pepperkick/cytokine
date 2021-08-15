import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Matches (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should return 400 if POST request for match was sent without game parameter', () => {
    return request(app.getHttpServer())
      .post('/api/v1/matches')
      .send({ game: null })
      .set({ "Authorization": "Bearer Test123" })
      .expect(400)
      .expect(function(res) {
        if (!res.body.message.includes('game should not be empty')) {
          console.log(res.body.message)
          throw new Error("Expected message not found")
        }
      })
  });

  it('should return 400 if POST request for match was sent with wrong game type', () => {
    return request(app.getHttpServer())
      .post('/api/v1/matches')
      .send({ game: 1 })
      .set({ "Authorization": "Bearer Test123" })
      .expect(400)
      .expect(function(res) {
        if (!res.body.message.includes('game must be a string')) {
          console.log(res.body.message)
          throw new Error("Expected message not found")
        }
      })
  });

  it('should return 400 if POST request for match was sent with wrong game', () => {
    return request(app.getHttpServer())
      .post('/api/v1/matches')
      .send({ game: "unknown" })
      .set({ "Authorization": "Bearer Test123" })
      .expect(400)
      .expect(function(res) {
        if (!res.body.message.includes('game must be a valid enum value')) {
          console.log(res.body.message)
          throw new Error("Expected message not found")
        }
      })
  });

  it('should return 400 if POST request for match was sent with wrong region type', () => {
    return request(app.getHttpServer())
      .post('/api/v1/matches')
      .send({ region: 1 })
      .set({ "Authorization": "Bearer Test123" })
      .expect(400)
      .expect(function(res) {
        if (!res.body.message.includes('region must be a string')) {
          console.log(res.body.message)
          throw new Error("Expected message not found")
        }
      })
  });

  it('should return 400 if POST request for match was sent without region parameter', () => {
    return request(app.getHttpServer())
      .post('/api/v1/matches')
      .send({ region: null })
      .set({ "Authorization": "Bearer Test123" })
      .expect(400)
      .expect(function(res) {
        if (!res.body.message.includes('region should not be empty')) {
          console.log(res.body.message)
          throw new Error("Expected message not found")
        }
      })
  });
});
