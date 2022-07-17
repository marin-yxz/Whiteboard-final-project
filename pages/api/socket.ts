import { userInfo } from 'os';
import { Server } from 'socket.io';
import {
  addFirstPlayerIfFirstPlayerDisconnects,
  addMessagesAndReturnAllMessages,
  addtToScore,
  createRoomifNotExistAndJoin,
  deleteScore,
  deleteUserFromRoomIfDisconnect,
  displayScore,
  firstPlayerAfterRounds,
  getMessagesInRoom,
  getUserById,
  getUserByValidSessionToken,
  getUsersInRoom,
  getUsersInRoomById,
  nextPlayerIfWordGuessed,
  scoreInsert,
  setGameState,
  setTheFirstPlayer,
} from '../../util/database';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    io.on('connection', (socket) => {
      console.log(socket);
      socket.on('input-change', (msg, room) => {
        socket.to(room).emit('update-input', msg);
      });
      socket.on('disconnect', async () => {
        const roomId = await deleteUserFromRoomIfDisconnect(socket.id);
        console.log('disconnected ', roomId);
        const usersInRoom = await getUsersInRoomById(roomId[0].room_id);
        const userWhoDisconnected = await getUserById(roomId[0].user_id);
        const firsyplayerStatus = await addFirstPlayerIfFirstPlayerDisconnects(
          roomId,
          userWhoDisconnected.username,
          usersInRoom[0].user_name,
        );
        if (firsyplayerStatus === 'changed') {
          socket.nsp
            .to(usersInRoom[0].socket_id)
            .emit('room', usersInRoom, '', true);
        }
        socket.nsp.to(usersInRoom[0].name).emit('room', usersInRoom);
      });
      socket.on('join-room', async (token, room) => {
        const user = await getUserByValidSessionToken(token.token);
        const date = new Date();
        await createRoomifNotExistAndJoin(
          room.room,
          user.id,
          socket.id,
          date.toISOString(),
        );
        const usersInRoom = await getUsersInRoom(room.room);
        const messages = await getMessagesInRoom(room.room);
        await socket.join(room.room);
        if (usersInRoom.length >= 2) {
        }
        if (usersInRoom.length === 1) {
          await setTheFirstPlayer(room.room, user.username);
          await scoreInsert(room.room, user.username);
          socket.nsp.to(socket.id).emit('room', usersInRoom, messages, true);
        } else {
          await scoreInsert(room.room, user.username);
          socket.nsp.to(room.room).emit('room', usersInRoom, messages);
        }
      });
      socket.on('activeplayer', async (token, room) => {
        const user = await getUserByValidSessionToken(token);
        const activeplayer = await setGameState(room, user.username);
        console.log('my userse:', activeplayer);
        if (activeplayer[0].rounds === 1) {
          const player = await firstPlayerAfterRounds(room);
          console.log(player);
          const usersInRoom = await getUsersInRoom(room);
          const messages = await getMessagesInRoom(room);
          await deleteScore(room);
          const score = await displayScore(room);
          socket.nsp.to(room).emit('score', score);
          socket.nsp.to(player).emit('room', usersInRoom, messages, true);
        } else {
          socket.nsp
            .to(room)
            .emit('game', activeplayer[0].active_player_id, 10);
          socket.nsp
            .to(activeplayer[0].socketid)
            .emit('word', activeplayer[0].word);
        }
      });
      socket.on('send-message', async (info, room) => {
        const date = new Date();
        const user = await getUserByValidSessionToken(info.token);
        const correct = await nextPlayerIfWordGuessed(info.message, room);
        console.log('correct', correct);
        if (correct) {
          // const activeplayer = await setGameState(room, user.username);
          // console.log('my userse:', activeplayer);
          await addtToScore(user);
          const score = await displayScore(room);
          socket.nsp.to(room).emit('score', score);
          socket.nsp.to(room).emit('game', correct[0].active_player_id, 10);
          socket.nsp.to(room).emit('word', '');
          socket.nsp.to(correct[0].socketid).emit('word', correct[0].word);
        }
        const messages = await addMessagesAndReturnAllMessages(
          user.id,
          room,
          info.message,
          date.toISOString(),
        );
        socket.nsp.to(room).emit('message', messages);
      });
      socket.on('send-canvas', async (token, canvas, room) => {
        const user = await getUserByValidSessionToken(token);
        if (canvas === 'clear') {
          socket.nsp.to(room).emit('canvas', canvas);
        } else {
          socket.to(room).emit('canvas', canvas);
        }
      });
    });
  }
  res.end();
};

export default SocketHandler;
