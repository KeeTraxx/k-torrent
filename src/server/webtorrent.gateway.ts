import { Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebtorrentService } from './webtorrent/webtorrent.service';

@WebSocketGateway({ path: '/ws' })
export class WebtorrentGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebtorrentGateway.name);

  @WebSocketServer()
  server: Server;

  lastValue = '';

  constructor(private webtorrentService: WebtorrentService) {}
  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected!`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client ${client.id} connected!`);

    client.emit('torrents', this.lastValue);
  }

  onModuleInit() {
    setInterval(() => {
      const data = JSON.stringify(this.webtorrentService.getTorrents());
      if (this.lastValue !== data) {
        this.server.emit('torrents', data);
        this.lastValue = data;
      }
    }, 1000);
  }
}
