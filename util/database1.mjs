import camelcaseKeys from 'camelcase-keys';
import postgres from 'postgres';

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
export async function getUserByValidSessionToken(token) {
  if (!token) return undefined;

  const [user] = await sql`
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

  // await deleteExpiredSessions();

  return user && camelcaseKeys(user);
}
