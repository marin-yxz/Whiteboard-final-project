import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import cookie from 'cookie';
import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import { redirect } from 'next/dist/server/api-utils';
import { createSerializedRegisterSessionTokenCookie } from '../../../util/cookies';
import { addPasworldessUser, createSession } from '../../../util/database';

// export default(req,res){

// }
// export default NextAuth({
//   debug: true,
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     }),
//   ],
//   secret: process.env.JWT_SECRET,
//   callbacks: {
//     // redirect(url, baseUrl) {
//     //   return baseUrl;
//     // },

//     async signIn(user, account, profile) {
//       if (user) {
//         const token = crypto.randomBytes(80).toString('base64');
//         // const session = await createSession(token);
//         console.log('this is my user', user.user.name);
//         console.log('this is the session i created', token);
//         const returningUser = await addPasworldessUser(user.user.name);
//         const session = await createSession(token, returningUser.id);
//         const serializeCookie =
//           await createSerializedRegisterSessionTokenCookie(session.token);
//         console.log(session);
//         console.log(returningUser);
//       }
//       return true;
//     },
//   },
// });

const nextAuthOptions = (req, res) => {
  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    callbacks: {
      // redirect(url, baseUrl) {
      //   return baseUrl;
      // },

      async signIn(user, account, profile) {
        if (user) {
          const token = crypto.randomBytes(80).toString('base64');
          // const session = await createSession(token);
          console.log('this is my user', user.user.name);
          console.log('this is the session i created', token);
          const returningUser = await addPasworldessUser(user.user.name);
          const session = await createSession(token, returningUser.id);
          const serializeCookie =
            await createSerializedRegisterSessionTokenCookie(session.token);
          console.log(session);
          console.log(returningUser);
          res.setHeader('set-Cookie', [
            serializeCookie,
            cookie.serialize('next-auth.session-token', '', {
              maxAge: -1,
              path: '/',
            }),
            cookie.serialize('next-auth.callback-url', '', {
              maxAge: -1,
              path: '/',
            }),
            cookie.serialize('next-auth.csrf-token', '', {
              maxAge: -1,
              path: '/',
            }),
          ]);
        }
        return true;
      },
    },
    secret: process.env.JWT_SECRET,
  };
};
export default (req, res) => {
  return NextAuth(req, res, nextAuthOptions(req, res));
};
