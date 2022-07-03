import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { getUserById, User } from '../../util/database';

type Props = {
  user?: User;
};
export default function UserDetails(props: Props) {
  if (!props.user) {
    return (
      <div>
        <Head>user</Head>
        <main>
          <h1>User not found</h1>
        </main>
      </div>
    );
  }
  return (
    <div>
      <Head>user</Head>
      <main>
        <h1>{props.user.username}</h1>
      </main>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const userIdFromUrl = context.query.userId;
  if (!userIdFromUrl || Array.isArray(userIdFromUrl)) {
    return { props: {} };
  }
  const user = await getUserById(parseInt(userIdFromUrl));
  console.log(user);
  if (user === undefined) {
    context.res.statusCode = 404;
    return {
      props: {},
    };
  }
  return {
    props: {
      user: user,
    },
  };
}
