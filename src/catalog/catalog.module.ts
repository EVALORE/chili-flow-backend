import { Module } from '@nestjs/common';
import { JamendoModule } from '../jamendo/jamendo.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [JamendoModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
