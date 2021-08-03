import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import {
  TorrentDTO,
  WebtorrentService,
  WebtorrentSettings,
} from './webtorrent.service';

@Controller('api/torrents')
export class WebtorrentController {
  constructor(private webtorrentService: WebtorrentService) {}

  @Get()
  get(): Array<TorrentDTO> {
    return this.webtorrentService.getTorrents();
  }

  @Post()
  async addTorrent(
    @Body() addTorrentRequest: AddTorrentRequest,
  ): Promise<TorrentDTO> {
    try {
      return this.webtorrentService.addMagnetURI(addTorrentRequest.magnetURI);
    } catch (err) {
      throw new BadRequestException(addTorrentRequest, 'Wrongly wrong!');
    }
  }

  @Get('settings')
  getSettings(): WebtorrentSettings {
    return this.webtorrentService.getSettings();
  }
}

interface AddTorrentRequest {
  magnetURI: string;
}
