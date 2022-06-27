import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';
import { LoginResponseBody } from './api/login';

const Main = styled.div``;
export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<
    {
      message: string;
    }[]
  >([]);
  const router = useRouter();
  async function loginHandler() {
    const loginRespones = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });
    const loginResponeBody: LoginResponseBody = await loginRespones.json();
    if ('errors' in loginResponeBody) {
      setErrors(loginResponeBody.errors);
    }
    console.log(loginResponeBody);
    const returnTo = router.query.returnTo;
    console.log(returnTo);
    if (returnTo && !Array.isArray(returnTo)) {
      await router.push(returnTo);
    } else {
      await router.push(`/user/${loginResponeBody.user.id}`);
    }
  }

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="login" content="Login" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Main>Login</Main>
      <label>
        username:{' '}
        <input
          value={username}
          onChange={(event) => {
            setUsername(event.currentTarget.value);
          }}
        />
      </label>
      <label>
        password:{' '}
        <input
          value={password}
          onChange={(event) => {
            setPassword(event.currentTarget.value);
          }}
        />
      </label>
      <button
        onClick={() => {
          loginHandler().catch((e) => {
            console.log(e);
          });
        }}
      >
        Login
      </button>
      {errors.length &&
        errors.map((error) => (
          <div
            style={{ color: 'white', backgroundColor: 'red', padding: '5px' }}
            key={'error ' + error.message}
          >
            {error.message}
          </div>
        ))}
    </div>
  );
}
