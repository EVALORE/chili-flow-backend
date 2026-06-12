import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JamendoModule } from '../jamendo/jamendo.module';
import { TracksModule } from '../tracks/tracks.module';
import { RecentlyPlayedController } from './recently-played.controller';
import { RecentlyPlayedRepository } from './recently-played.repository';
import { RecentlyPlayedService } from './recently-played.service';

@Module({
  imports: [DatabaseModule, JamendoModule, TracksModule],
  controllers: [RecentlyPlayedController],
  providers: [RecentlyPlayedRepository, RecentlyPlayedService],
})
export class RecentlyPlayedModule {}
