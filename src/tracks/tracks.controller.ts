import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TracksService } from './tracks.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { audioFileFilter } from './storage/audio-file.storage';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { UploadTrackDto } from './dto/upload-track.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadedTrackResponseDto } from './dto/uploaded-track-response.dto';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';

@ApiTags('tracks')
@ApiBearerAuth('bearer')
@Controller('tracks')
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: UploadedTrackResponseDto })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'artist', 'file'],
      properties: {
        title: { type: 'string', example: 'Night Drive' },
        artist: { type: 'string', example: 'Chili Flow' },
        genre: { type: 'string', example: 'Electronic' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: audioFileFilter,
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadTrackDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tracksService.upload(user.id, dto, file);
  }

  @Get()
  @ApiOkResponse({ type: UploadedTrackResponseDto, isArray: true })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.tracksService.list(user.id);
  }

  @Delete(':id')
  @ApiOkResponse({ type: DeleteResponseDto })
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tracksService.delete(user.id, id);
  }
}
