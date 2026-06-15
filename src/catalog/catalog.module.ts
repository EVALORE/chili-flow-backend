import { Module } from '@nestjs/common';
import { JamendoModule } from '../jamendo/jamendo.module';
import { CatalogCacheService } from './catalog-cache.service';
import { CatalogController } from './catalog.controller';
import { CatalogRateLimitGuard } from './catalog-rate-limit.guard';
import { CatalogService } from './catalog.service';

@Module({
  imports: [JamendoModule],
  controllers: [CatalogController],
  providers: [CatalogCacheService, CatalogRateLimitGuard, CatalogService],
})
export class CatalogModule {}
