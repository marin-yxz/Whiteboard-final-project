import 'doodle.css/doodle.css';
import { signOut } from 'next-auth/react';
// import { css } from '@emotion/react';
import Link from 'next/link';
import styled from 'styled-components';

const HeaderMain = styled.header`
  @import url('https://fonts.googleapis.com/css2?family=Short+Stack&display=swap');
  font-family: 'Short Stack', cursive;
  /* padding: 8px 14px; */
  /* background: #e1e1e1; */
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  display: flex;
  gap: 20px;
  height: 5vh;
  padding: 10px;
  > div > a + a {
    margin-left: 10px;
  }
  > div {
    margin-right: auto;
    margin-left: 10px;
  }
`;
function Anchor({ children, ...restProps }) {
  // using a instead of Link since we want to force a full refresh
  return <a {...restProps}>{children}</a>;
}
export default function Header(props) {
  return (
    <HeaderMain>
      <div>
        <Link href="/">Skribbly</Link>
      </div>
      {props.user && <a>{props.user.username}</a>}
      {/* {props.user && (
        <Link href="/user/private-profile">
          <a className="doodle-border">{props.user.username}</a>
        </Link>
      )} */}
      {props.user ? (
        <Anchor href="/logout">Logout</Anchor>
      ) : (
        <>
          <Link href="/register">
            <a>Register</a>
          </Link>
          <Link href="/login">
            <a>Login</a>
          </Link>
        </>
      )}
    </HeaderMain>
  );
}
