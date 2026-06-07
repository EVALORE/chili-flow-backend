import { Module } from '@nestjs/common';
import { validateEnv } from './config/env.validation';
import appConfig from './config/app.config';
import { ConfigModule } from '@nestjs/config';
import { JamendoModule } from './jamendo/jamendo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    JamendoModule,
  ],
})
export class AppModule {}
