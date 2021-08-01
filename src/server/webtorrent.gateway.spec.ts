import { Test, TestingModule } from '@nestjs/testing';
import { WebtorrentGateway } from './webtorrent.gateway';

describe('WebtorrentGateway', () => {
  let gateway: WebtorrentGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebtorrentGateway],
    }).compile();

    gateway = module.get<WebtorrentGateway>(WebtorrentGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
