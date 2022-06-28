import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from 'next';
import { createSerializedRegisterSessionTokenCookie } from '../../util/cookies';
import {
  createSession,
  getUserwithPaswordHashByUsername,
} from '../../util/database';

export type LoginResponseBody =
  | {
      errors: {
        message: string;
      }[];
    }
  | { user: { id: number } };
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponseBody>,
) {
  if (req.method === 'POST') {
    if (
      typeof req.body.username !== 'string' ||
      typeof req.body.password !== 'string' ||
      !req.body.username ||
      !req.body.password
    ) {
      res
        .status(400)
        .json({ errors: [{ message: 'username or password not provided' }] });
      return;
    }
    const userWithPasswordUseWithCaution =
      await getUserwithPaswordHashByUsername(req.body.username);
    if (!userWithPasswordUseWithCaution) {
      res
        .status(400)
        .json({ errors: [{ message: 'username or password doesnt match' }] });
      return;
    }
    console.log(userWithPasswordUseWithCaution);
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      userWithPasswordUseWithCaution.passwordHash,
    );
    console.log(userWithPasswordUseWithCaution);
    console.log(passwordMatch);
    if (!passwordMatch) {
      res
        .status(400)
        .json({ errors: [{ message: 'username or password doesnt match' }] });
      return;
    }
    const userId = userWithPasswordUseWithCaution.id;
    const token = crypto.randomBytes(80).toString('base64');
    const session = await createSession(token, userId);
    const serializeCookie = await createSerializedRegisterSessionTokenCookie(
      session.token,
    );
    console.log(session);
    res
      .status(200)
      .setHeader('set-Cookie', serializeCookie)
      .json({ user: { id: userId } });
  } else {
    res.status(405).json({ errors: [{ message: 'method not allowed' }] });
  }
}
