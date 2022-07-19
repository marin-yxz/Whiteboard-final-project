import 'doodle.css/doodle.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';
import { LoginResponseBody } from './api/login';

type Props = {
  refreshUserProfile: () => Promise<void>;
};
const Main = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Short+Stack&display=swap');
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
`;
const LoginDiv = styled.div``;
const UserDiv = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
`;
export default function Register(props: Props) {
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
      await props.refreshUserProfile();
      await router.push(returnTo);
    } else {
      await props.refreshUserProfile();
      await router.push(`/`);
    }
  }

  return (
    <Main className="doodle" style={{ backgroundColor: 'white' }}>
      <Head>
        <title>Create Next App</title>
        <meta name="login" content="Login" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LoginDiv>
        {/* <div>Login</div> */}
        <UserDiv>
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
              type="password"
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
        </UserDiv>
        {errors.length > 0 &&
          errors.map((error) => (
            <div
              style={{ color: 'white', backgroundColor: 'red', padding: '5px' }}
              key={'error ' + error.message}
            >
              {error.message}
            </div>
          ))}
      </LoginDiv>
    </Main>
  );
}
