// import _ from 'lodash';
// import postgres from 'postgres';

const _ = require('lodash');
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
const rooms = [];

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
    if (data[0].id !== '') {
      socket.join(room);
      console.log('room', room);
      console.log('id', data[0].id);
    }
    if (data[0].id !== '') {
      const array = data;
      array[0].room = room;

      if (rooms.find((el) => el.id === data[0].id && el.room === room)) {
      } else {
        rooms.push(data[0]);
        const index = rooms.findIndex((object) => {
          return object.room === room;
        });
        console.log(index);
        rooms[index].gamestate = false;
      }
    }
    const skribllWords = ['water', 'power'];
    const roomy = rooms.filter((el) => el.room === room);
    const filter = rooms.filter((el) => el.room === room);

    let counter = 0;
    if (roomy.some((el) => el.gamestate === true)) {
      const word1 = skribllWords[Math.floor(Math.random() * 380)];
      roomy[0].word = word1;
      let i = 0;
      if (data[1]?.p === word1) {
        counter = 10;
      }
      const b = setInterval(() => {
        const word = skribllWords[Math.floor(Math.random() * 380)];
        counter++;
        console.log(rooms);
        if (data[1]?.p === word) {
          counter = 9;
        }
        if (roomy[i + 1]?.state === undefined) {
          roomy[i].state = false;
          roomy[0].state = true;
          roomy[0].word = word;
          roomy[i].word = '';
          i = 0;
        } else {
          roomy[i].state = false;
          i++;
          roomy[i].state = true;
          roomy[i].word = word;
          roomy[i - 1].word = '';
        }
        console.log('counter', counter);
        if (counter === 10) {
          clearInterval(b);
        }
        socket.nsp.to(room).emit('users', roomy);
      }, 10000);
    }
    socket.nsp.to(room).emit('users', _.uniqBy(filter, 'id'));
  });
});
server.listen(8000);
