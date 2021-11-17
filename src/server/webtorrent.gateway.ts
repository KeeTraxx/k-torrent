import { Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TorrentDTO, WebtorrentService } from './webtorrent/webtorrent.service';

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

      if (!this.webtorrentService.getTorrents()?.length && process.env.SIM) {
        const t: TorrentDTO = {
          announce: ['ANNOUNCE-URL'],
          comment: 'COMMENT',
          created: new Date(),
          createdBy: 'CREATED-BY',
          done: false,
          downloadSpeed: ~~(Math.random() * 300 * 1000),
          downloaded: 1235.5,
          files: [
            {
              downloaded: 1234,
              length: 1024,
              name: 'file.txt',
              path: '/file.txt',
              progress: 0.5,
            },
          ],
          infoHash: 'hashihash',
          lastPieceLength: 123,
          length: 1234,
          magnetURI: 'magnet:123455',
          maxWebConns: 100,
          name: 'NAME',
          numPeers: 1234,
          path: '/path',
          paused: false,
          pieceLength: 1024,
          progress: 0.8,
          ratio: 0.8,
          ready: true,
          received: 1234,
          timeRemaining: 120345,
          uploadSpeed: 300,
          uploaded: 303248,
        };
        this.server.emit('torrents', JSON.stringify([t]));
      }
    }, 1000);
  }
}
