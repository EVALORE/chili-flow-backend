import { Module } from '@nestjs/common';
import { JamendoClient } from './jamendo.client';
import { JamendoService } from './jamendo.service';

@Module({
  providers: [JamendoClient, JamendoService],
  exports: [JamendoService],
})
export class JamendoModule {}
