import * as http from 'node:http';
import { addSeconds } from 'date-fns';
import express from 'express';
import _ from 'lodash';
import next from 'next';
import * as socketio from 'socket.io';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

nextApp
  .prepare()
  .then(async () => {
    const app = express();
    const server = http.createServer(app);
    const io = new socketio.Server();
    io.attach(server);

    app.get('/hello', async (_, res) => {
      await res.send('Hello World');
    });

    io.on('connection', async (socket) => {
      console.log('connected with', socket.id);
      socket.emit('status', 'Hello from Socket.io');

      socket.on('disconnect', (room) => {
        console.log(socket.id, 'client disconnected');
        // const clients = io.sockets.adapter.rooms.get(room);
        // console.log('first client', socketsinRoom[0].id);
      });
      socket.on('join-room', async (room, user, state) => {
        const clients = io.sockets.adapter.rooms.get(room);
        console.log(_.size(clients));
        await socket.join(room);
        if (_.size(clients) === 0 && !state) {
          socket.nsp.to(room).emit('room', user);
          console.log('hallo' + socket.id);
          socket.nsp.to(socket.id).emit('firstPlayer', true);
        } else {
          socket.nsp.to(room).emit('room', user);
        }

        // console.log('first client', socketsinRoom[0].id);

        // console.log(socketsinRoom[0].adapter.sids[socket.id]);
        // console.log(io.of('/').adapter.sids);
        // console.log(io.of('/').adapter.rooms['2']);
        console.log(io.sockets.adapter.rooms.get(room));
      });
      socket.on('turnState', (state, room) => {
        console.log(state, room);
        const clients = io.sockets.adapter.rooms.get(room);
        for (const clientId of clients) {
          if (socket.id === io.sockets.sockets.get(clientId).id) {
            socket.to(socket.id).emit('turn', false);
            console.log('succes');
          } else {
            return console.log(io.sockets.sockets.get(clientId).id);
          }
          // const clientSocket = io.sockets.sockets.get(clientId).id;
          // console.log()
        }
      });
      socket.on('message', (msg, room) => {
        socket.to(room).emit('msg', msg);
      });
      socket.on('canvas', (canvas, room) => {
        socket.to(room).emit('canvasData', canvas);
      });
    });

    app.all('*', (req, res) => nextHandler(req, res));

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
