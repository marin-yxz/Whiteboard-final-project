import camelcaseKeys from 'camelcase-keys';
// import { config } from 'dotenv-safe';
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
