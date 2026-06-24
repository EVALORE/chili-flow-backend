import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JamendoModule } from '../jamendo/jamendo.module';
import { UploadedTracksModule } from '../uploaded-tracks/uploaded-tracks.module';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsRepository } from './playlists.repository';
import { PlaylistsService } from './playlists.service';

@Module({
  imports: [DatabaseModule, JamendoModule, UploadedTracksModule],
  controllers: [PlaylistsController],
  providers: [PlaylistsRepository, PlaylistsService],
})
export class PlaylistsModule {}
