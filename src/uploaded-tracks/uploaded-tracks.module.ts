import { Module } from '@nestjs/common';
import { UploadedTracksController } from './uploaded-tracks.controller';
import { UploadedTracksService } from './uploaded-tracks.service';
import { UploadedTracksRepository } from './uploaded-tracks.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UploadedTracksController],
  providers: [UploadedTracksService, UploadedTracksRepository],
  exports: [UploadedTracksService],
})
export class UploadedTracksModule {}
