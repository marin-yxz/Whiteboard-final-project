import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', async (socket) => {
      console.log('conected');
      io.fetchSockets()
        .then((sockets) => {
          console.log(sockets);
        })
        .catch(console.log);
      socket.on('room', async (room, players) => {
        await socket.join(room);
        const sockets = await io.in(room).fetchSockets();
        console.log(sockets);
        socket.to(room).emit('receieve-users', players);
      });
      socket.on('message', (message, room) => {
        socket.to(room).emit('receive-message', message);
        console.log('not good');
      });
      socket.on('canvas', (canvas, room) => {
        socket.to(room).emit('receive-canvas', canvas);
        console.log('not good');
      });
    });
  }
  res.end();
};

export default SocketHandler;
