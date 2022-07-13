import camelcaseKeys from 'camelcase-keys';
import { addSeconds } from 'date-fns';
import { sq } from 'date-fns/locale';
import postgres from 'postgres';

declare module globalThis {
  let postgresSqlClient: ReturnType<typeof postgres> | undefined;
}
function connectOneTimeToDatabase() {
  let sql;

  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    sql = postgres({ ssl: { rejectUnauthorized: false } });
  } else {
    if (!globalThis.postgresSqlClient) {
      globalThis.postgresSqlClient = postgres();
    }
    sql = globalThis.postgresSqlClient;
  }
  return sql;
}
const sql = connectOneTimeToDatabase();
export type User = {
  id: number;
  username: string;
};
type UserWithPasswordHash = User & {
  passwordHash: string;
};

export async function createUser(username: string, passwordHash: string) {
  const [user] = await sql<[User]>`
  INSERT INTO users
    (username,password_hash)
  VALUES
    (${username},${passwordHash})
  RETURNING
  id,
  username
`;
  return camelcaseKeys(user);
}
export async function getUserByUsername(username: string) {
  if (!username) {
    return undefined;
  }
  const [user] = await sql<[User | undefined]>`
  SELECT
    id,username
  FROM
  users
  WHERE
  username=${username}
  `;
  return user && camelcaseKeys(user);
}

export async function getUserById(userId: number) {
  if (!userId) {
    return undefined;
  }
  const [user] = await sql<[User | undefined]>`
  SELECT
    id,username
  FROM
  users
  WHERE
  id=${userId}
  `;
  return user && camelcaseKeys(user);
}

export async function getUserwithPaswordHashByUsername(username: string) {
  if (!username) {
    return undefined;
  }
  const [user] = await sql<[UserWithPasswordHash | undefined]>`
  SELECT
    *
  FROM
  users
  WHERE
  username=${username}
  `;
  return user && camelcaseKeys(user);
}
type Session = {
  id: number;
  token: string;
};
export async function createSession(token: string, userId: User['id']) {
  const [session] = await sql<[Session]>`
  INSERT INTO sessions
  (token,user_id)
  VALUES
    (${token},${userId})
  RETURNING
    id,
    token
  `;
  return camelcaseKeys(session);
}
export async function getUserByValidSessionToken(token: string) {
  if (!token) return undefined;

  const [user] = await sql<[User | undefined]>`
  SELECT
    users.id,
    users.username
  FROM
    users,
    sessions
  WHERE
    sessions.token = ${token} AND
    sessions.user_id = users.id AND
    sessions.expiry_timestamp > now();
  `;
  return user && camelcaseKeys(user);
}
export async function deleteSessionByToken(token: string) {
  const [session] = await sql<[Session | undefined]>`
  DELETE FROM
    sessions
  WHERE
    sessions.token = ${token}
  RETURNING *
  `;
  return session && camelcaseKeys(session);
}

export async function deleteExpiredSessions() {
  const sessions = await sql<[Session[]]>`
  DELETE FROM
    sessions
  WHERE
    expiry_timestamp < now()
  RETURNING *
  `;
  return sessions.map((session) => camelcaseKeys(session));
}
export async function getUsersInRoom(room: number) {
  let users = await sql`
  SELECT
  users.id as user_id,
  users.username as user_name
FROM
  users,
  rooms,
  user_room
WHERE
  rooms.name = ${room} AND
  user_room.user_id = users.id AND
  user_room.room_id = rooms.id
  ORDER BY "time" ASC;
  `;

  users = users.filter(function (props) {
    delete props.user_id;
    return true;
  });
  return users;
}
export async function createRoomifNotExistAndJoin(
  room: string,
  userId: number,
  socket: string,
  time: string,
) {
  const createdRoom = await sql`
    INSERT INTO rooms(name) VALUES(${room}) ON CONFLICT(name) DO NOTHING ;
  `;
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room};
  `;

  await sql`
    INSERT INTO user_room(user_id,room_id,socket_id,time) VALUES(${userId}, ${roomid[0].id}, ${socket} ,${time}) ON CONFLICT(user_id) DO NOTHING;
  `;
  const gameId = await sql`
  SELECT id from user_room WHERE room_id=${roomid[0].id}`;
  return createdRoom;
}
export async function addMessagesAndReturnAllMessages(
  user_id: number,
  room_id: number,
  messages: string,
  time: string,
) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;
  await sql`
       INSERT INTO messages(user_id,room_id,messages,time) VALUES(
      ${user_id}, ${roomid[0].id},${messages},${time});
`;
  const retrieveMessages = await sql`
SELECT
users.id as user_id,
users.username as user_name,
messages,
time
FROM
  users,
  rooms,
  messages
WHERE
  rooms.id = ${roomid[0].id} AND
  messages.user_id = users.id AND
  messages.room_id = rooms.id
  ORDER BY "time" ASC;
`;
  return retrieveMessages;
}
export async function getMessagesInRoom(room_id) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;
  const retrieveMessages = await sql`
  SELECT
  users.id as user_id,
  users.username as user_name,
  messages,
  time
  FROM
    users,
    rooms,
    messages
  WHERE
    rooms.id = ${roomid[0].id} AND
    messages.user_id = users.id AND
    messages.room_id = rooms.id
    ORDER BY "time" ASC;

  `;
  return retrieveMessages;
}
export async function getUsersInRoomById(room: string) {
  const users = await sql`
  SELECT
  users.id as user_id,
  users.username as user_name,
  name,
  socket_id
FROM
  users,
  rooms,
  user_room
WHERE
  rooms.id = ${room} AND
  user_room.user_id = users.id AND
  user_room.room_id = rooms.id
  ORDER BY "time" DESC;
  `;
  return users;
}
export async function getGameState(room_id) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;
  const gamesState = await sql`
  SELECT games FROM rooms WHERE room_id=${roomid[0].id};
  `;
}
export async function deleteUserFromRoomIfDisconnect(socket_id: string) {
  const userWhoDisconnected = await sql`
  DELETE FROM user_room WHERE socket_id=${socket_id} RETURNING *
  `;
  return userWhoDisconnected;
}
export async function setTheFirstPlayer(room_id: string, firstPlayer: string) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;
  await sql`
  INSERT INTO  games(room_id,firstPlayer) VALUES(${roomid[0].id},${firstPlayer})`;
}

async function activePlayer(user, word, date, room) {
  const activeplayer = await sql`
  UPDATE games SET active_player_id=${user}, firstPlayer='',word=${word},start_game_endTime=${date} WHERE room_id=${room} RETURNING active_player_id,word
    `;
  return activeplayer;
}
async function findSocketFromPlayerName(name) {
  const playerId = await sql`
SELECT id FROM users WHERE username=${name}
`;
  const socketId = await sql`
SELECT socket_id FROM user_room WHERE user_id=${playerId[0].id}
`;
  return socketId[0].socket_id;
}
export async function setGameState(room_id: string, active_player_id: string) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;

  const users = await sql`
   SELECT
   users.id as user_id,
   users.username as user_name,
   name
 FROM
   users,
   rooms,
   user_room
 WHERE
   rooms.name = ${room_id} AND
   user_room.user_id = users.id AND
   user_room.room_id = rooms.id
   ORDER BY "time" ASC;
   `;
  const first = await sql`
   SELECT firstPlayer FROM games WHERE room_id=${roomid[0].id}
   `;
  const randomWordId = Math.floor(Math.random() * 380);

  const randomWord = await sql`
      SELECT word FROM words WHERE id=${randomWordId}`;

  const date = new Date();
  const newdate = addSeconds(date, 30);
  if (first[0].firstplayer !== '') {
    const socketid = await findSocketFromPlayerName(active_player_id);

    const activeplayer = await activePlayer(
      active_player_id,
      randomWord[0].word,
      newdate.toISOString(),
      roomid[0].id,
    );
    activeplayer[0].socketid = socketid;

    return activeplayer;
  } else {
    const index = users.findIndex((object) => {
      return object.user_name === active_player_id;
    });
    if (index === users.length - 1) {
      const socketid = await findSocketFromPlayerName(users[0].user_name);

      const activeplayer = await activePlayer(
        users[0].user_name,
        randomWord[0].word,
        newdate.toISOString(),
        roomid[0].id,
      );
      activeplayer[0].socketid = socketid;
      return activeplayer;
    } else {
      const socketid = await findSocketFromPlayerName(
        users[index + 1].user_name,
      );

      const activeplayer = await activePlayer(
        users[index + 1].user_name,
        randomWord[0].word,
        newdate.toISOString(),
        roomid[0].id,
      );
      activeplayer[0].socketid = socketid;
      return activeplayer;
    }
  }
}
export async function addFirstPlayerIfFirstPlayerDisconnects(
  roomId,
  user,
  nextUser,
) {
  const selectPlayer = await sql`
  SELECT firstPlayer FROM games WHERE room_id=${roomId[0].room_id}
  `;

  if (user === selectPlayer[0].firstplayer) {
    await sql`
    UPDATE games SET firstPlayer=${nextUser} WHERE room_id=${roomId[0].id}`;
    return 'changed';
  } else {
    return 'not changed';
  }
}
export async function nextPlayerIfWordGuessed(
  message: string,
  room_id: string,
) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;
  console.log(roomid);
  const users = await sql`
  SELECT
  users.id as user_id,
  users.username as user_name,
  name
FROM
  users,
  rooms,
  user_room
WHERE
  rooms.name = ${room_id} AND
  user_room.user_id = users.id AND
  user_room.room_id = rooms.id
  ORDER BY "time" ASC;
  `;
  console.log(users);
  const word = await sql`
    SELECT word,active_player_id FROM games WHERE room_id=${roomid[0].id}`;
  const randomWordId = Math.floor(Math.random() * 380);

  const randomWord = await sql`
         SELECT word FROM words WHERE id=${randomWordId}`;

  const date = new Date();
  const newdate = addSeconds(date, 30);

  if (word[0].word === message) {
    const index = users.findIndex((object) => {
      return object.user_name === word[0].active_player_id;
    });
    if (index === users.length - 1) {
      const socketid = await findSocketFromPlayerName(users[0].user_name);

      const activeplayer = await activePlayer(
        users[0].user_name,
        randomWord[0].word,
        newdate.toISOString(),
        roomid[0].id,
      );
      activeplayer[0].socketid = socketid;
      return activeplayer;
    } else {
      const socketid = await findSocketFromPlayerName(
        users[index + 1].user_name,
      );

      const activeplayer = await activePlayer(
        users[index + 1].user_name,
        randomWord[0].word,
        newdate.toISOString(),
        roomid[0].id,
      );
      activeplayer[0].socketid = socketid;
      return activeplayer;
    }
  } else {
    return false;
  }
  // console.log('word', word);
  // return word[0].word === message;
}
export async function scoreInsert(room_id, username) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;
  console.log(roomid);
  const gamesId = await sql`
  SELECT id FROM games WHERE room_id=${roomid[0].id}`;
  const user = await getUserByUsername(username);
  console.log(user);
  await sql`
  INSERT INTO user_games_scores (user_id,game_id,score) VALUES(${user.id},${gamesId[0].id},0) ON CONFLICT(user_id) DO NOTHING`;
}

export async function addtToScore(user_id) {
  await sql`
  UPDATE user_games_scores
   SET score = score + 1
WHERE user_id = ${user_id.id};
  `;
}
export async function displayScore(room_id) {
  const roomid = await sql`
  SELECT id FROM rooms WHERE name=${room_id};
  `;
  const gamesId = await sql`
  SELECT id FROM games WHERE room_id=${roomid[0].id}`;
  console.log(gamesId);
  const scores = await sql`
  SELECT
  users.username as user_name,
  score
FROM
  users,
  rooms,
  user_games_scores
WHERE
  user_games_scores.user_id = users.id AND
  user_games_scores.game_id=${gamesId[0].id}
  `;
  return scores;
}
