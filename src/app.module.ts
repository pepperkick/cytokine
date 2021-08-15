import { Module } from '@nestjs/common';
import { ApiModule } from "./modules/api/api.module";
import { MongooseModule } from "@nestjs/mongoose";
import * as config from "../config.json"

@Module({
  imports: [
    ApiModule,
    MongooseModule.forRoot(config.mongodbUri)
  ],
})
export class AppModule {}
