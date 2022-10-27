import { Module } from '@nestjs/common';

import { MongoDBModule } from './mongodb.module';

@Module({
  imports: [MongoDBModule],
})
export class DatabaseModule {}
