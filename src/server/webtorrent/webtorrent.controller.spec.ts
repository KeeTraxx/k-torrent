import { Test, TestingModule } from '@nestjs/testing';
import { WebtorrentController } from './webtorrent.controller';

describe('WebtorrentController', () => {
  let controller: WebtorrentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebtorrentController],
    }).compile();

    controller = module.get<WebtorrentController>(WebtorrentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
