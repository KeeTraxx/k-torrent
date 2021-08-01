import { Test, TestingModule } from '@nestjs/testing';
import { WebtorrentService } from './webtorrent.service';

describe('WebtorrentService', () => {
  let service: WebtorrentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebtorrentService],
    }).compile();

    service = module.get<WebtorrentService>(WebtorrentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
