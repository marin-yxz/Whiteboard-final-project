import 'doodle.css/doodle.css';
import { Button, TextField } from '@mui/material';
import { GetServerSidePropsContext } from 'next';
import { getSession, signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import GoogleButton from 'react-google-button';
import styled from 'styled-components';
import spaceImage from '../public/629732.png';
import { LoginResponseBody } from './api/login';

type Props = {
  refreshUserProfile: () => Promise<void>;
};

const LoginDiv = styled.div`
  width: 100%;
`;
const UserDiv = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  & + & {
    margin-top: 10px;
  }
`;
const LoginSection = styled.div`
  /* display: flex; */
  /* justify-content: center; */

  /* width: 60vw; */
  width: 100%;
  max-width: 40vw;
  height: 95vh;
  padding: 30px;
  border-radius: 5px;
  box-shadow: 0px 10px 13px -7px #000000, 0px 0px 27px 11px rgba(0, 0, 0, 0.1);
`;
const Main = styled.div`
  display: flex;
`;
const ImageDiv = styled.div`
  display: flex;
  overflow: hidden;
`;
const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  & + & {
    padding: 30px;
  }
`;
const TextDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;
const RegisterDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 10px;
  align-items: center;
  margin-top: 8px;
  gap: 3px;
`;
const StyledLink = styled(Link)`
  color: red;
`;
const AnchorLink = styled.a`
  font-size: 11px;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: chocolate;
  &:hover {
    color: blue;
  }
`;
export default function Register(props: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<
    {
      message: string;
    }[]
  >([]);
  const { data: session, status } = useSession();
  console.log(status);

  console.log(session);
  if (status === 'authenticated') {
  }
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
    <>
      <Head>
        <title>Login</title>
        <meta name="login" content="Login" />
        <link rel="icon" href="/pen.png" />
      </Head>
      <Main>
        <LoginSection>
          <LoginContainer style={{ backgroundColor: 'white' }}>
            <LoginDiv>
              {/* <div>Login</div> */}
              <UserDiv>
                <TextDiv>
                  <h1>Welcome back to Skribbly login</h1>
                  <h3 style={{ opacity: '0.7' }}>
                    It's great to have you back!
                  </h3>
                </TextDiv>
                <TextField
                  value={username}
                  onChange={(event) => {
                    setUsername(event.currentTarget.value);
                  }}
                  id="standard-basic"
                  label="username"
                  margin="normal"
                  variant="standard"
                />
                <TextField
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.currentTarget.value);
                  }}
                  margin="normal"
                  id="standard-basic"
                  label="password"
                  variant="standard"
                />

                <Button
                  style={{ marginTop: '30px' }}
                  onClick={() => {
                    loginHandler().catch((e) => {
                      console.log(e);
                    });
                  }}
                  variant="contained"
                  disableElevation
                >
                  login
                </Button>
              </UserDiv>
              {errors.length > 0 &&
                errors.map((error) => (
                  <div
                    style={{
                      color: 'white',
                      backgroundColor: 'red',
                      padding: '5px',
                    }}
                    key={'error ' + error.message}
                  >
                    {error.message}
                  </div>
                ))}
              <RegisterDiv>
                <h6 style={{ margin: 0, opacity: '0.9', padding: 0 }}>
                  Not a member?
                </h6>

                <StyledLink style={{ margin: 0 }} href="/register">
                  <AnchorLink>Signup</AnchorLink>
                </StyledLink>
              </RegisterDiv>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {' '}
                <h2>OR</h2>
                {/* <button
                  style={{
                    backgroundColor: 'white',
                    border: '0.5px solid black',
                    borderRadius: '3px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => signIn('google')}
                >
                  Login with google
                </button> */}
                <GoogleButton
                  onClick={() => {
                    signIn('google').catch((err) => {
                      console.log(err);
                    });
                  }}
                />
              </div>
            </LoginDiv>
          </LoginContainer>
        </LoginSection>
        <ImageDiv>
          <Image objectFit="cover" src={spaceImage} alt="yo" />
        </ImageDiv>
      </Main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  console.log('this is my session', session);
  // if (session) {
  //   return {
  //     redirect: {
  //       destination: '/',
  //     },
  //   };
  // }
  return {
    props: { session },
  };
}
