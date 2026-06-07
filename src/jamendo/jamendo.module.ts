import { Module } from '@nestjs/common';
import { JamendoController } from './jamendo.controller';
import { JamendoClient } from './jamendo.client';
import { JamendoService } from './jamendo.service';

@Module({
  controllers: [JamendoController],
  providers: [JamendoClient, JamendoService],
  exports: [JamendoService],
})
export class JamendoModule {}
