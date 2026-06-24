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
import { UploadedTracksService } from './uploaded-tracks.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { audioFileFilter } from './storage/audio-file.storage';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateUploadedTrackDto } from './dto/create-uploaded-track.dto';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UploadedTrackResponseDto } from './dto/uploaded-track-response.dto';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';

@ApiTags('uploaded tracks')
@ApiBearerAuth('bearer')
@ApiCookieAuth('chili_flow_session')
@Controller('uploaded-tracks')
@UseGuards(JwtAuthGuard)
export class UploadedTracksController {
  constructor(private readonly uploadedTracksService: UploadedTracksService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an uploaded track',
    description:
      'Creates a local uploaded track owned by the authenticated user. This endpoint accepts multipart form data and stores the audio file locally.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: UploadedTrackResponseDto })
  @ApiBody({
    description:
      'Uploaded track metadata and the audio file to store for the authenticated user.',
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
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUploadedTrackDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.uploadedTracksService.create(user.id, dto, file);
  }

  @Get()
  @ApiOperation({
    summary: 'List uploaded tracks',
    description:
      'Returns local uploaded tracks owned by the authenticated user only.',
  })
  @ApiOkResponse({ type: UploadedTrackResponseDto, isArray: true })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.uploadedTracksService.list(user.id);
  }

  @Delete(':uploadedTrackId')
  @ApiOperation({
    summary: 'Delete an uploaded track',
    description:
      'Deletes one local uploaded track owned by the authenticated user. The uploadedTrackId path parameter is the local uploaded-track ID.',
  })
  @ApiParam({
    name: 'uploadedTrackId',
    description: 'Local uploaded-track ID, not a Jamendo catalog track ID.',
  })
  @ApiOkResponse({ type: DeleteResponseDto })
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('uploadedTrackId') uploadedTrackId: string,
  ) {
    return this.uploadedTracksService.delete(user.id, uploadedTrackId);
  }
}
