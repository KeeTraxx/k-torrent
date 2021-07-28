import { Elm } from './Main.elm'
import * as io from 'socket.io/client-dist/socket.io';

const app = Elm.Client.Main.init({
  node: document.querySelector('main')
});

console.log(app.ports);

const socket = io(undefined, { path: '/ws' });
socket.on('torrents', torrents => {
  app.ports.torrents.send(torrents);
});
