import { GetServerSidePropsContext } from 'next';
import { useCallback, useEffect, useRef, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import io from 'socket.io-client';
import styled from 'styled-components';
import { getUserByValidSessionToken } from '../../util/database';

let socket;
const Chat = styled.div`
  height: 80vh;
`;
const DivContainer = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  justify-content: space-between;
  padding-left: 10%;
  padding-right: 10%;
  background-image: url('/background.jpg');
`;
const Messages = styled.div`
  background-color: #80ced7;
  border-radius: 2px;
  overflow-y: scroll;
  height: 90%;
  ::-webkit-scrollbar {
    display: none;
  }
  /* max-height: 70vh; */
`;
export default function Home(props) {
  const [input, setInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef(null);
  const [firstPlayer, setFirstPlayer] = useState<boolean>();
  const [activePlayer, setActivePlayer] = useState<boolean>();
  const [activePlayerusername, setActivePlayerusername] = useState<string>();
  const [user, setUser] = useState<{ user_name: string; score: number }[]>([]);
  const [counter, setCounter] = useState<number>();
  const [sendingMessage, setSendingMessage] = useState<string>('');
  const [score, setScore] = useState([]);
  const [receievedMessage, setReceievedMessage] = useState<
    { user_id: number; user_name: string; messages: string; time: string }[]
  >([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [word, setWord] = useState('');
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth * 0.5;
      canvas.height = window.innerHeight * 0.8;
      canvas.style = `${window.innerWidth}px`;
      canvas.style = `${window.innerHeight}px`;
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.strokeStyle = 'red';
        context.lineWidth = 5;
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        contextRef.current = context;
      }
    }
  }, []);
  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const imgData = canvas.toDataURL();
      socket.emit('send-canvas', props.token, imgData, props.room);
    }
  };
  function startDrawing({ nativeEvent }) {
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  }
  const draw = useCallback(
    ({ nativeEvent }) => {
      if (!isDrawing) {
        return;
      }
      if (contextRef.current) {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
      }
    },
    [isDrawing],
  );
  useEffect(() => {
    if (counter === 0) {
      if (activePlayerusername === props.user) {
        socket.emit('activeplayer', props.token, props.room);
        setWord('');
        socket.emit('send-canvas', props.token, 'clear', props.room);
        return;
      } else {
        return;
      }
    }
    const intervalId = setInterval(() => {
      if (counter) {
        setCounter(counter - 1);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [counter, activePlayerusername, props.room, props.token, props.user]);
  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('/api/socket');
      socket = io();

      socket.on('connect', () => {});

      socket.on('update-input', (msg: string) => {
        setInput(msg);
      });
      socket.on('game', (activeplayer, time) => {
        if (props.user === activeplayer) {
          setActivePlayer(true);
          setFirstPlayer(false);
        }
        setCounter(time);
        setActivePlayerusername(activeplayer);
      });
      socket.emit('join-room', { token: props.token }, { room: props.room });
      socket.on('message', (messageInfo) => {
        setReceievedMessage(messageInfo);
        socket.on('disconnect', () => {});
      });
      socket.on('room', (users, messages, firstPlayerFromSocket) => {
        setUser(users);
        console.log('socket emited', firstPlayerFromSocket);
        if (firstPlayerFromSocket) {
          setFirstPlayer(firstPlayerFromSocket);
        }
        if (messages) {
          setReceievedMessage(messages);
        }
      });
      socket.on('score', (scoreSocket) => {
        setScore(scoreSocket);
      });
      socket.on('word', (wordFromSocket) => {
        setWord(wordFromSocket);
      });
      socket.on('canvas', (imageSrc: string) => {
        const canvas1 = canvasRef.current;
        if (canvas1) {
          const context = canvas1.getContext('2d');
          if (context) {
            if (imageSrc === 'clear') {
              context.fillStyle = 'white';
              context.fillRect(0, 0, canvas1.width, canvas1.height);
            } else {
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
              image.src = imageSrc;
            }
          }
        }
      });
    };
    socketInitializer().catch(() => {});
  }, [props.room, props.token, props.user]);

  function sendMessageToChat() {
    socket.emit(
      'send-message',
      {
        message: sendingMessage,
        token: props.token,
      },
      props.room,
    );
  }
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessageToChat();
      setSendingMessage('');
    }
  };
  return (
    <DivContainer>
      <div style={{ backgroundColor: 'white' }}>
        {word}
        {counter}
        {firstPlayer && (
          <button
            onClick={() => {
              socket.emit('activeplayer', props.token, props.room);
            }}
          >
            start the game
          </button>
        )}
        {user.map((userInroom, index) => {
          return (
            <div
              style={{
                backgroundColor:
                  userInroom.user_name === activePlayerusername
                    ? 'blue'
                    : 'red',
              }}
              key={userInroom.user_name}
            >
              {userInroom.user_name}
            </div>
          );
        })}
        {score.map((user) => {
          return (
            <div style={{ backgroundColor: 'white' }} key={user.user_name}>
              {user.user_name}:{user.score}
            </div>
          );
        })}
      </div>
      <div
        style={{
          border: '1px solid black',
          width: '50vw',
          cursor: 'crosshair',
          height: '80vh',
        }}
      >
        <canvas
          style={{ pointerEvents: 'none', display: 'block' }}
          onMouseDown={(nativeEvent) => {
            if (activePlayerusername === props.user) {
              startDrawing(nativeEvent);
            }
          }}
          onMouseUp={() => {
            if (activePlayerusername === props.user) {
              finishDrawing();
            }
          }}
          onMouseMove={(nativeEvent) => {
            draw(nativeEvent);
          }}
          ref={canvasRef}
        />
      </div>
      <Chat>
        <Messages>
          <PerfectScrollbar>
            {receievedMessage.map((message, index) => (
              <div
                key={message.time}
                style={{
                  backgroundColor: index % 2 === 0 ? '#80ced7' : '#007ea7',
                }}
              >
                {message.user_name} :{message.messages}
              </div>
            ))}
          </PerfectScrollbar>
        </Messages>
        <input
          placeholder="Type something"
          value={sendingMessage}
          onInput={(e) =>
            setSendingMessage((e.target as HTMLInputElement).value)
          }
          onKeyDown={handleKeyDown}
        />
      </Chat>
    </DivContainer>
  );
}
export async function getServerSideProps(context: GetServerSidePropsContext) {
  if (!context.req.cookies.sessionToken) {
    return {
      redirect: {
        destination: '/',
      },
    };
  }
  const user = await getUserByValidSessionToken(
    context.req.cookies.sessionToken,
  );
  const gameUrl = context.query;
  return {
    props: {
      token: context.req.cookies.sessionToken,
      room: gameUrl.game,
      user: user.username,
    },
  };
}
