import { promises as fs } from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { Torrent, TorrentFile } from 'webtorrent';
import * as WebTorrent from 'webtorrent';
import { watch } from 'chokidar';

const toTorrentDTO = ({
  name,
  infoHash,
  magnetURI,
  announce,
  files,
  timeRemaining,
  downloaded,
  uploaded,
  downloadSpeed,
  uploadSpeed,
  progress,
  ratio,
  numPeers,
  maxWebConns,
  path,
  length,
  created,
  createdBy,
  comment,
  received,
  pieceLength,
  lastPieceLength,
  ready,
  paused,
  done,
}: Torrent): TorrentDTO => ({
  name,
  infoHash,
  magnetURI,
  announce,
  files: files.map(toTorrentFileDTO),
  timeRemaining,
  downloaded,
  uploaded,
  downloadSpeed,
  uploadSpeed,
  progress,
  ratio,
  numPeers,
  maxWebConns,
  path,
  length,
  created,
  createdBy,
  comment,
  received,
  pieceLength,
  lastPieceLength,
  ready,
  paused,
  done,
});

const toTorrentFileDTO = ({
  length,
  name,
  path,
  downloaded,
  progress,
}: TorrentFile): TorrentFileDTO => ({
  length,
  name,
  path,
  downloaded,
  progress,
});

@Injectable()
export class WebtorrentService {
  private readonly logger = new Logger(WebtorrentService.name);
  private webtorrent: WebTorrent.Instance;
  private CONF_DIR = process.env.CONFIG_DIR || '.config';
  private WATCH_DIR = process.env.WATCH_DIR || '.torrents';
  constructor() {
    fs.mkdir(this.CONF_DIR).catch((err) => {
      this.logger.verbose(err);
    });
    fs.mkdir(this.WATCH_DIR).catch((err) => {
      this.logger.verbose(err);
    });
    this.webtorrent = new WebTorrent({
      // @ts-ignore packages @types/webtorrent not yet published
      uploadLimit: parseInt(process.env.UPLOAD_LIMIT) || 5 * 1024 * 100,
      downloadLimit: parseInt(process.env.DOWNLOAD_LIMIT) || -1,
    });
    this.restoreTorrents();
    this.watchTorrentFiles();
  }
  private async restoreTorrents(): Promise<any> {
    const filePath = path.join(this.CONF_DIR, 'active_torrents.json');
    try {
      const magnetURIs = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      this.logger.log(`Restoring torrents ${magnetURIs.length}`);
      magnetURIs.forEach((magnetURI) => {
        this.addMagnetURI(magnetURI, false);
      });
    } catch (err) {
      this.logger.log(`${filePath} not found. Skipping restoring torrents.`);
    }
  }

  watchTorrentFiles() {
    this.logger.debug(`Start watching ${this.WATCH_DIR} for new files...`);
    watch(this.WATCH_DIR)
      .on('add', path => this.addTorrentFromDirectory(path));
  }

  async addTorrentFromDirectory(path: string): Promise<void> {
    console.log('torrent', path);
    await this.addMagnetURI(path);
    await fs.unlink(path);
  }



  public getTorrents(): Array<TorrentDTO> {
    return this.webtorrent.torrents.map(toTorrentDTO);
  }

  public async addMagnetURI(
    magnetURI: string,
    persist = true,
  ): Promise<TorrentDTO> {
    return new Promise((resolve, reject) => {
      try {
        const t = this.webtorrent.add(magnetURI, {
          path: process.env.DOWNLOAD_FOLDER || '.',
        });
        t.on('ready', () => {
          this.logger.log(`Start downloading: ${t.name}...`);
          persist && this.persistTorrents();
          resolve(toTorrentDTO(t));
        });
        t.on('error', (err) => reject(err));
        t.on('done', () => {
          this.logger.log(`Done downloading: ${t.name}!`);
          t.destroy();
          persist && this.persistTorrents();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async persistTorrents(): Promise<any> {
    this.logger.log(`Saving WebTorrent state...`);
    await fs.writeFile(
      path.join(this.CONF_DIR, 'active_torrents.json'),
      JSON.stringify(this.webtorrent.torrents.map((t) => t.magnetURI)),
      'utf-8',
    );
    this.logger.log(`Successfully saved WebTorrent state.`);
  }

  public getSettings(): WebtorrentSettings {
    console.log(this.webtorrent);
    return {
      // @ts-ignore
      downloadLimit: this.webtorrent._downloadLimit,
      // @ts-ignore
      uploadLimit: this.webtorrent._uploadLimit,
      downloadPath: process.env.DOWNLOAD_FOLDER || '.',
    };
  }
}

export interface WebtorrentSettings {
  uploadLimit: number;
  downloadLimit: number;
  downloadPath: string;
}

export interface TorrentDTO {
  readonly infoHash: string;

  readonly magnetURI: string;

  readonly files: TorrentFileDTO[];

  readonly announce: string[];

  readonly timeRemaining: number;

  readonly received: number;

  readonly downloaded: number;

  readonly uploaded: number;

  readonly downloadSpeed: number;

  readonly uploadSpeed: number;

  readonly progress: number;

  readonly ratio: number;

  readonly length: number;

  readonly pieceLength: number;

  readonly lastPieceLength: number;

  readonly numPeers: number;

  readonly path: string;

  readonly ready: boolean;

  readonly paused: boolean;

  readonly done: boolean;

  readonly name: string;

  readonly created: Date;

  readonly createdBy: string;

  readonly comment: string;

  readonly maxWebConns: number;
}

export interface TorrentFileDTO {
  readonly name: string;

  readonly path: string;

  readonly length: number;

  readonly downloaded: number;

  readonly progress: number;
}
