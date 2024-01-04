import { Module } from '@nestjs/common';
import { WebtorrentService } from './webtorrent/webtorrent.service.js';
import { WebtorrentGateway } from './webtorrent.gateway.js';
import { WebtorrentController } from './webtorrent/webtorrent.controller.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
  controllers: [WebtorrentController],
  providers: [WebtorrentService, WebtorrentGateway],
})
export class AppModule {}
