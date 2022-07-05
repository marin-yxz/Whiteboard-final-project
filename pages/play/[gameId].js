import 'react-perfect-scrollbar/dist/css/styles.css';
import _ from 'lodash';
import Head from 'next/head';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { io } from 'socket.io-client';
import styled from 'styled-components';
import { getUserByValidSessionToken } from '../../util/database';

const Main = styled.div`
  background-color: red;
`;
const socket = io('http://localhost:3000');

export default function Home(props) {
  const [sendingMessage, setSendingMessage] = useState('');
  const [receievedMessages, setReceievedMessages] = useState([]);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false); // state to track when user clicks to draw
  const [firstPlayer, setFirstPlayer] = useState(false);
  const [turn, setTurn] = useState(false);
  const [counter, setCounter] = useState(0);
  // INITALIZE SOCKET AND HANDLING ALL RESPONSES FROM SOCKET IF CONNECTED
  // console.log(props.user.username);
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style = `${window.innerWidth}px`;
    canvas.style = `${window.innerHeight}px`;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = 'red';
    context.lineWidth = 5;
    contextRef.current = context;
  }, []);
  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL();
    socket.emit('canvas', imgData, props.link.gameId);
    console.log('im drawing');
  };
  function startDrawing({ nativeEvent }) {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  }
  const draw = useCallback(
    ({ nativeEvent }) => {
      if (!isDrawing) {
        return;
      }
      const { offsetX, offsetY } = nativeEvent;
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    },
    [isDrawing],
  );
  useEffect(() => {
    socket.on('connect', () => {});
  }, []);
  useEffect(() => {
    console.log('up');
    socket.emit(
      'join-room',
      props.link.gameId,
      props.user.username,
      firstPlayer,
      props.session,
    );
  }, []);
  useEffect(() => {
    socket.on('room', (user) => {
      console.log(user);

      setPlayers((previousState) => {
        const newState = [...previousState, user];
        return newState;
      });
    });
  }, []);
  useEffect(() => {
    socket.on('firstPlayer', (turn1) => {
      setFirstPlayer(turn1);
    });
  }, [firstPlayer]);
  useEffect(() => {
    socket.on('msg', (msg) => {
      setReceievedMessages((previousState) => {
        const newState = [...previousState, msg];
        return newState;
      });
    });
  }, []);
  useEffect(() => {
    socket.on('canvasData', (canvas) => {
      const canvas1 = canvasRef.current;
      const context = canvas1.getContext('2d');
      const image = new Image();
      image.onload = function () {
        context.drawImage(
          image,
          0,
          0,
          image.width,
          image.height,
          0,
          0,
          canvas1.width,
          canvas1.height,
        );
      };
      image.src = canvas;
    });
  }, []);
  useEffect(() => {
    socket.on('turn', (data) => {
      console.log(data);
      setFirstPlayer(data.firstPlayer);

      setTurn(data.turn);
    });
  }, []);
  useEffect(() => {
    socket.on('counter', (data) => {
      setCounter((data.datePlus30sec - data.dateNow) / 1000);
    });
  }, []);
  const x = function (player_turn) {
    if (player_turn) {
      return true;
    }
  };
  useEffect(() => {
    console.log(turn);
    if (counter === 0) {
      if (turn) {
        socket.emit('turnState', false, props.link.gameId, turn);
        return;
      } else {
        return;
      }
    }

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setCounter(counter - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
    // add timeLeft as a dependency to re-rerun the effect
    // when we update it
  }, [counter, turn]);
  useEffect(() => {});
  function sendState() {
    socket.emit('turnState', firstPlayer, props.link.gameId, turn);
  }
  function sendMessageToChat() {
    setReceievedMessages([
      ...receievedMessages,
      {
        message: sendingMessage,
        username: props.user.username,
        timestamp: new Date(),
      },
    ]);
    socket.emit(
      'message',
      {
        message: sendingMessage,
        username: props.user.username,
        timestamp: new Date(),
      },
      props.link.gameId,
    );
  }
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <input
        placeholder="Type something"
        // value={sendMessageToChat}
        onInput={(e) => setSendingMessage(e.target.value)}
      />
      <button
        onClick={() => {
          sendMessageToChat();
        }}
      >
        send message {sendingMessage}
      </button>
      {counter ? <div>{counter}</div> : ''}
      {firstPlayer ? (
        <button
          onClick={() => {
            sendState();
          }}
        >
          start the game
        </button>
      ) : (
        <div>waiting for first player to start</div>
      )}
      {players.map((player) => {
        return (
          <div key={player}>
            <div>{player}</div>
          </div>
        );
      })}
      {receievedMessages.map((Chat) => {
        return (
          <div
            style={{ backgroundColor: 'red' }}
            key={Chat.username + ':' + Chat.message + Chat.timestamp}
          >
            <div>
              {Chat.username}:{Chat.message}
            </div>
          </div>
        );
      })}

      <canvas
        style={{ pointerEvents: 'none', display: 'block' }}
        onMouseDown={(nativeEvent) => {
          if (turn) {
            startDrawing(nativeEvent);
          }
        }}
        onMouseUp={(nativeEvent) => {
          if (turn) {
            finishDrawing(nativeEvent);
          }
        }}
        onMouseMove={(nativeEvent) => {
          draw(nativeEvent);
        }}
        ref={canvasRef}
      />

      <Main>chat</Main>
    </div>
  );
}
export async function getServerSideProps(context) {
  const user = await getUserByValidSessionToken(
    context.req.cookies.sessionToken,
  );
  const gameUrl = context.query;
  if (user) {
    return {
      props: {
        link: gameUrl,
        user: user,
        session: context.req.cookies.sessionToken,
      },
    };
  }
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}
