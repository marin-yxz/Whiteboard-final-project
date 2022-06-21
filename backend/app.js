const app = require('express')();
const server = require('node:http').createServer(app);

const io = require('socket.io')(
  server,
  {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  },
  { maxHttpBufferSize: 1e8, pingTimeout: 60000 },
);
io.on('connection', (socket) => {
  console.log(socket.id);
  socket.on('chat', function (data) {
    io.emit('message', data);
  });
  socket.on('canvas', function (data) {
    socket.broadcast.emit('canvasState', data);
  });
});
server.listen(8000);
