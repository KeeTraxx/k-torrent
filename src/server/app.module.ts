import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebtorrentService } from './webtorrent/webtorrent.service';
import { WebtorrentGateway } from './webtorrent.gateway';
import { WebtorrentController } from './webtorrent/webtorrent.controller';

@Module({
  imports: [],
  controllers: [AppController, WebtorrentController],
  providers: [AppService, WebtorrentService, WebtorrentGateway],
})
export class AppModule {}
