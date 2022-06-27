import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';
import { RegisterResponseBody } from './api/register';

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
  async function registerHandler() {
    const registerRespones = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });
    const registerResponeBody: RegisterResponseBody =
      await registerRespones.json();
    console.log(registerResponeBody);
    if ('errors' in registerResponeBody) {
      setErrors(registerResponeBody.errors);
    }
    await router.push('/');
  }

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="registration" content="Register a new user" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Main>Register</Main>
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
          registerHandler().catch((e) => {
            console.log(e);
          });
        }}
      >
        Register
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
