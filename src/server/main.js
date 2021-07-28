const fs = require('fs').promises;
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { path: '/ws' });
const WebTorrent = require('webtorrent');
const webtorrentClient = new WebTorrent({
  // uploadSpeed: 524288,
  //downloadSpeed: 10485760
  uploadLimit: 524288,
  downloadLimit: 524288
});
const PORT = process.env.PORT || 8080;

http.listen(PORT, () => console.log(`listening on PORT ${PORT}`));

io.on('connection', socket => {
  console.log('CONNECT!');
  socket.emit('torrents', lastSent);
  socket.on('disconnect', () => 'DISCONNECT!');
});

app.use(express.static('dist'));
app.use(express.json());

app.get('/api/torrents', (req, res) => {
  res.send(webtorrentClient.torrents.map(convertTorrent));
});

app.post('/api/torrents', (req, res) => {
  const { magnetURI } = req.body;
  try {
    const torrent = addTorrent(magnetURI);
    torrent.once('ready', () => {
      res.status(200).send(convertTorrent(torrent));
      persistTorrents();
    });
  } catch (e) {
    console.error(e);
    res.status(400).send();
  }
});

app.use(express.static('dist'));

const persistTorrents = async () => {
  const magnetURIs = webtorrentClient.torrents.map(t => t.magnetURI);
  await fs.writeFile('active_torrents.json', JSON.stringify(magnetURIs), 'utf-8');
}

const restoreTorrents = async () => {
  try {
    const torrents = JSON.parse(await fs.readFile('active_torrents.json', 'utf-8'));
    torrents.forEach(magnetURI => addTorrent(magnetURI));
  } catch (err) {
    console.warn('No active_torrents.json');
  }
}

restoreTorrents();

const addTorrent = magnetURI => {
  if (!magnetURI || !magnetURI.startsWith('magnet:')) {
    throw new Error("MagnetURI invalid!");
  }
  const torrent = webtorrentClient.add(magnetURI, {
    path: '.'
  });
  torrent.on('done', () => {
    webtorrentClient.remove(torrent);
    persistTorrents();
  });
  return torrent;
}

let lastSent;

setInterval(() => {
  const toSend = JSON.stringify(webtorrentClient.torrents.map(convertTorrent));
  if (lastSent !== toSend) {
    io.emit('torrents', toSend);
    lastSent = toSend;
  }
}, 1000);

const sim = [{
  name: "testerli Torrent",
  infoHash: "infohash_1234testerli",
  magnetURI: "magnet:something",
  announce: "notsupported",
  files: [{
    done: false,
    length: 1234,
    name: "testfile",
    path: "./testfile",
    downloaded: 1234,
    progress: 0
  }],
  timeRemaining: 3600,
  downloaded: 0,
  uploaded: 0,
  downloadSpeed: 123.12,
  uploadSpeed: 123.12,
  progress: 0,
  ratio: 0.5,
  numPeers: ~~(Math.random() * 100),
  maxWebConns: ~~(Math.random() * 100),
  path: '.',
  length: 1234,
  created: new Date().toISOString(),
  createdBy: "simulator",
  comment: "simulated file"
}];

if (process.env.SIM) {
  setInterval(() => {
    sim.forEach((t, i) => {
      t.files.forEach((f, i) => {
        f.downloaded += 204
        f.progress = (f.progress += 0.1);
        if (f.progress >= 1) f.progress = 0;
      });
      t.timeRemaining -= 1 * (i + 1);
      if (t.timeRemaining < 0) t.timeRemaining = 3600;
      t.downloaded += 204;
      t.uploaded += 12;
      t.downloadSpeed = ~~(Math.random() * 12043);
      t.uploadSpeed = ~~(Math.random() * 12043);
      t.progress += 0.1;
      if (t.progress >= 1) t.progress = 0;
      t.ratio = Math.random();
      t.numPeers = ~~(Math.random() * 100);
    });
    io.emit('torrents', JSON.stringify(sim));
  }, 1000);
}

const convertTorrent = ({
  name, infoHash, magnetURI, announce, files, timeRemaining, downloaded, uploaded, downloadSpeed, uploadSpeed, progress, ratio, numPeers, maxWebConns, path, length, created, createdBy, comment
}) => ({ name, infoHash, magnetURI, announce, files: files.map(convertFile), timeRemaining, downloaded, uploaded, downloadSpeed, uploadSpeed, progress, ratio, numPeers, maxWebConns, path, length, created, createdBy, comment });

const convertFile = ({
  done, length, name, path, downloaded, progress
}) => ({
  done, length, name, path, downloaded, progress
});