import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthTransport } from './auth-transport';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT?: number;

  @IsString()
  JWT_SECRET!: string;

  @IsEnum(AuthTransport)
  @IsOptional()
  AUTH_TRANSPORT?: AuthTransport;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JAMENDO_CLIENT_ID!: string;

  @IsString()
  @IsOptional()
  JAMENDO_API_BASE_URL?: string;

  @IsString()
  UPLOADS_DIR!: string;

  @IsString()
  PUBLIC_BACKEND_URL!: string;

  @IsString()
  @IsOptional()
  JAMENDO_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  JAMENDO_REDIRECT_URI?: string;

  @IsString()
  @IsOptional()
  FRONTEND_ORIGIN?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  CATALOG_RATE_LIMIT_WINDOW_SECONDS?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  CATALOG_RATE_LIMIT_MAX_REQUESTS?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  CATALOG_CACHE_TTL_SECONDS?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  CATALOG_CACHE_MAX_ENTRIES?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
