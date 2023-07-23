import { Module } from '@nestjs/common';
import { WebtorrentService } from './webtorrent/webtorrent.service';
import { WebtorrentGateway } from './webtorrent.gateway';
import { WebtorrentController } from './webtorrent/webtorrent.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
  controllers: [WebtorrentController],
  providers: [WebtorrentService, WebtorrentGateway],
})
export class AppModule {}
