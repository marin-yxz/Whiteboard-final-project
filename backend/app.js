const app = require('express')();
const server = require('node:http').createServer(app);

const io = require('socket.io')(
  server,
  {
    cors: {
      origin: 'http://localhost:8000',
      methods: ['GET', 'POST'],
    },
  },
  { maxHttpBufferSize: 1e8, pingTimeout: 60000 },
);

io.on('connection', (socket) => {
  socket.on('chat', function (data, room) {
    socket.to(room).emit('message', data);
    console.log(data);
  });
  socket.on('user', function (data, users) {
    socket.to(users).emit('userList', data);
  });
  socket.on('canvas', function (data, room) {
    socket.to(room).emit('canvasState', data);
  });
  socket.on('leave-room', (room) => {
    console.log('user left room ' + room);
    socket.leave(room);
  });
  socket.on('join-room', (room, data) => {
    console.log('joined room ' + room);
    socket.to(room).emit('users', data);
    socket.join(room);
  });
});
server.listen(8000);
