import express, { Express, Request, Response } from 'express';
import * as http from 'http';
import _ from 'lodash';
import next, { NextApiHandler } from 'next';
import * as socketio from 'socket.io';
import { getUserByValidSessionToken } from './util/database';

const port: number = parseInt(process.env.PORT || '3000', 10);
const dev: boolean = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp
  .prepare()
  .then(async () => {
    const app: Express = express();
    const server: http.Server = http.createServer(app);
    const io: socketio.Server = new socketio.Server();
    io.attach(server);

    app.get('/hello', async (_: Request, res: Response) => {
      await res.send('Hello World');
    });

    io.on('connection', (socket: socketio.Socket) => {
      console.log('connection');
      socket.emit('status', 'Hello from Socket.io');
      socket.on('join-room', async (room, user, state, session) => {
        console.log('my user ', user);
        const validUser = await getUserByValidSessionToken(session);
        console.log('valid user :', validUser);
        const clients = io.sockets.adapter.rooms.get(room);

        await socket.join(room);
        if (_.size(clients) === 0 && !state) {
          socket.nsp.to(room).emit('room', user);

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
      socket.on('disconnect', () => {
        console.log('client disconnected');
      });
    });

    app.all('*', (req: any, res: any) => nextHandler(req, res));

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
