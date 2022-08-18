import { Server } from 'socket.io';
import {
  addFirstPlayerIfFirstPlayerDisconnects,
  addMessagesAndReturnAllMessages,
  addRoundsIfWordGuessed,
  addtToScore,
  createRoomifNotExistAndJoin,
  DeleteEverythingIfNoUsersInRoom,
  deleteScore,
  deleteUserFromRoomIfDisconnect,
  displayScore,
  firstPlayerAfterRounds,
  getAllRooms,
  getMessagesInRoom,
  getUserById,
  getUserByValidSessionToken,
  getUsersInRoom,
  getUsersInRoomById,
  nextPlayerIfWordGuessed,
  ReturnActivePlayer,
  roundsAdder,
  scoreInsert,
  setGameState,
  setTheFirstPlayer,
  SetWordAfterRounds,
} from '../../util/database';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    io.on('connection', (socket) => {
      socket.on('input-change', (msg, room) => {
        socket.to(room).emit('update-input', msg);
      });
      socket.on('disconnect', async () => {
        const roomId = await deleteUserFromRoomIfDisconnect(socket.id);
        console.log('disconnected ', roomId);
        const usersInRoom = await getUsersInRoomById(roomId[0].room_id);
        console.log('ROOM ID ', roomId);
        const userWhoDisconnected = await getUserById(roomId[0].user_id);

        console.log('my users in romo', usersInRoom);

        if (usersInRoom.length > 0) {
          const firsyplayerStatus =
            await addFirstPlayerIfFirstPlayerDisconnects(
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
          socket.nsp.to(usersInRoom[0].name).emit('room', usersInRoom);
        } else {
          await DeleteEverythingIfNoUsersInRoom(roomId[0].room_id);
          const rooms = await getAllRooms();
          socket.broadcast.emit('display-activeGame', rooms);
        }
      });
      socket.on(
        'join-room',
        async (token: { token: string }, room: { room: string }) => {
          const user = await getUserByValidSessionToken(token.token);
          if (!user) {
          } else {
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
            const rooms = await getAllRooms();
            socket.broadcast.emit('display-activeGame', rooms);
            if (usersInRoom.length >= 2) {
            }
            if (usersInRoom.length === 1) {
              await setTheFirstPlayer(room.room, user.username);
              await scoreInsert(room.room, user.username);
              socket.nsp
                .to(socket.id)
                .emit('room', usersInRoom, messages, true);
            } else {
              await scoreInsert(room.room, user.username);
              socket.nsp.to(room.room).emit('room', usersInRoom, messages);
            }
          }
        },
      );
      socket.on('activeplayer', async (token, room) => {
        const user = await getUserByValidSessionToken(token);
        if (!user) {
        } else {
          const activeplayer = await setGameState(room, user.username);
          console.log('my userse:', activeplayer);
          socket.nsp.to(room).emit('end-score', []);
          if (activeplayer[0].rounds === 3) {
            const player = await firstPlayerAfterRounds(room);
            console.log(player);
            const usersInRoom = await getUsersInRoom(room);
            const messages = await getMessagesInRoom(room);
            const scoreBefore = await displayScore(room);
            await deleteScore(room);
            const score = await displayScore(room);
            await SetWordAfterRounds(room);
            socket.nsp.to(room).emit('score', score);
            socket.nsp.to(room).emit('game', '', 0);
            socket.nsp.to(player).emit('room', usersInRoom, messages, true);
            socket.nsp.to(room).emit('end-score', scoreBefore);
          } else {
            socket.nsp
              .to(room)
              .emit('game', activeplayer[0].active_player_id, 20);
            socket.nsp
              .to(activeplayer[0].socketid)
              .emit('word', activeplayer[0].word);
            // socket.nsp.to(room).emit('canvas', 'clear');
          }
        }
      });
      socket.on('send-message', async (info, room) => {
        const date = new Date();
        const user = await getUserByValidSessionToken(info.token);
        let lastActivePlayer;
        let correct;
        const activePlayer = await ReturnActivePlayer(room);
        if (activePlayer[0].active_player_id !== user.username) {
          lastActivePlayer = await addRoundsIfWordGuessed(room);
          correct = await nextPlayerIfWordGuessed(info.message, room);
        }

        console.log('correct', correct);

        console.log(activePlayer[0].active_player_id, user.username);
        if (correct) {
          const rounds = await roundsAdder(
            room,
            lastActivePlayer[0].active_player_id,
          );
          socket.nsp.to(room).emit('canvas', 'clear');
          await addtToScore(user);
          const score = await displayScore(room);
          if (rounds === 3) {
            const player = await firstPlayerAfterRounds(room);
            console.log(player);
            const usersInRoom = await getUsersInRoom(room);
            const messages = await getMessagesInRoom(room);
            await deleteScore(room);
            await SetWordAfterRounds(room);
            const score1 = await displayScore(room);
            console.log('THIS IS A SCORE BEFORE 0', score);
            socket.nsp.to(room).emit('score', score1);
            socket.nsp.to(player).emit('room', usersInRoom, messages, true);
            socket.nsp.to(room).emit('game', '', 0);
            socket.nsp.to(room).emit('word', '');
            socket.nsp.to(room).emit('end-score', score);
          } else {
            socket.nsp.to(room).emit('score', score);
            socket.nsp.to(room).emit('game', correct[0].active_player_id, 20);
            socket.nsp.to(room).emit('word', '');
            socket.nsp.to(correct[0].socketid).emit('word', correct[0].word);
          }
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
        const activePlayer = await ReturnActivePlayer(room);
        console.log(activePlayer);
        console.log(user);
        if (user.username === activePlayer[0].active_player_id) {
          if (canvas === 'clear') {
            socket.nsp.to(room).emit('canvas', canvas);
          } else {
            socket.to(room).emit('canvas', canvas);
          }
        }
      });
      socket.on('send-emoji', async (EmojiObject) => {
        const user = await getUserByValidSessionToken(EmojiObject.token);
        console.log(EmojiObject);
        socket.nsp.to(EmojiObject.room).emit('emojiNotifications', [
          {
            user: user.username,
            emoji: EmojiObject.emoji,
            time: EmojiObject.time,
          },
        ]);
      });
    });
  }
  res.end();
};

export default SocketHandler;
