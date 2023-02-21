/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { AdminPublicationController } from './admin-publication.controller';

@Module({
    imports: [],
    exports: [],
    // controllers: [AdminPublicationController],
    providers: [],
})
export class AdminModule {}
