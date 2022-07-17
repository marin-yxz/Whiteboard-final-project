import 'doodle.css/doodle.css';
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
  display: flex;
  gap: 10px;
  > div > a + a {
    margin-left: 10px;
  }
  > div {
    margin-right: auto;
    margin-left: 10px;
  }
`;
export default function Header(props) {
  return (
    <HeaderMain className="doodle-border">
      <div className="doodle-border">
        <Link href="/">Home</Link>
      </div>
      {props.user && (
        <Link href="/user/private-profile">
          <a className="doodle-border">{props.user.username}</a>
        </Link>
      )}
      {props.user ? (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a className="doodle-border" href="/logout">
          Logout
        </a>
      ) : (
        <>
          <Link className="doodle-border" href="/register">
            <a className="doodle-border">Register</a>
          </Link>
          <Link className="doodle-border" href="/login">
            <a className="doodle-border">Login</a>
          </Link>
        </>
      )}
    </HeaderMain>
  );
}
