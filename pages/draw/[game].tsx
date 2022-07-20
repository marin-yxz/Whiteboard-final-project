import 'doodle.css/doodle.css';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import Image2 from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import io from 'socket.io-client';
import styled from 'styled-components';
import logo from '../../public/pen.gif';
import { getUserByValidSessionToken } from '../../util/database';

let socket;
const Chat = styled.div`
  /* height: 80vh; */
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;
const DivContainer = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Short+Stack&display=swap');
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 96vh;
  font-family: 'Short Stack', cursive;
  /* justify-content: space-between; */
  padding-left: 10%;
  padding-right: 10%;
  background-image: url('/background.jpg');
`;
const Messages = styled.div`
  /* background-color: #80ced7; */
  border-radius: 2px;
  overflow-y: scroll;
  height: 90%;
  ::-webkit-scrollbar {
    display: none;
  }
  max-height: 70vh;
`;
const MainDiv = styled.div`
  display: flex;
  flex-direction: row;
`;
const CanvasAndChat = styled.div`
  /* background-color: white; */

  display: flex;
  justify-content: center;
`;
const PlayerDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 70px;
  width: 200px;
  padding-left: 20px;
  padding-right: 20px;
  align-items: center;
`;
const ButtonDiv = styled.div`
  display: flex;
  justify-content: center;
`;
const WordDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
`;
const ContainingDiv = styled.div`
  border-radius: 6px;
`;
const CounterDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 30px;
`;
let drawingInterval;
export default function Home(props) {
  const [input, setInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [firstPlayer, setFirstPlayer] = useState<boolean>();
  const [activePlayer, setActivePlayer] = useState<boolean>();
  const [activePlayerusername, setActivePlayerusername] = useState<string>();
  const [user, setUser] = useState<{ user_name: string; score: number }[]>([]);
  const [counter, setCounter] = useState<number>();
  const [sendingMessage, setSendingMessage] = useState<string>('');
  const [score, setScore] = useState<{ user_name: string; score: number }[]>(
    [],
  );
  const [displayEndScore, setDisplayEndScore] = useState<
    { user_name: string; score: number }[]
  >([]);
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

      (canvas.style as any) = `${window.innerWidth}px`;
      (canvas.style as any) = `${window.innerHeight}px`;
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
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
      clearInterval(drawingInterval);
      drawingInterval = null;
    }
  };
  function startDrawing({ nativeEvent }) {
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
    const canvas = canvasRef.current;
    if (!drawingInterval) {
      drawingInterval = setInterval(() => {
        if (canvas) {
          const imgData = canvas.toDataURL();
          socket.emit('send-canvas', props.token, imgData, props.room);
        }
      }, 100);
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
      finishDrawing();
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
        console.log(activePlayer);
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
      socket.on('end-score', (scores) => {
        console.log('IM EXPECTING SCORES', scores);
        setDisplayEndScore(scores);
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
        console.log(scoreSocket, 'my scores');
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
    <>
      <Head>
        <title>Skribbly</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/pen.png" />
      </Head>
      <DivContainer>
        <ContainingDiv className="doodle">
          {firstPlayer && (
            <ButtonDiv>
              <button
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  socket.emit('activeplayer', props.token, props.room);
                }}
              >
                start the game
              </button>
            </ButtonDiv>
          )}
          <CounterDiv>{counter}</CounterDiv>
          <WordDiv>{word}</WordDiv>
          <MainDiv>
            <div>
              {user.map((userInroom) => {
                return (
                  <PlayerDiv
                    className="doodle-border"
                    key={userInroom.user_name}
                  >
                    {userInroom.user_name}
                    {userInroom.user_name === activePlayerusername && (
                      <div style={{ height: '50px', width: '50px' }}>
                        <Image2 src={logo} alt="yo" />
                      </div>
                    )}
                  </PlayerDiv>
                );
              })}
              <h5>CURRENT SCORE:</h5>
              {score.map((score_user) => {
                return (
                  <div key={score_user.user_name}>
                    {score_user.user_name}:{score_user.score}
                  </div>
                );
              })}
              <h5>FINAL SCORE:</h5>
              {displayEndScore.map((scores) => {
                return (
                  <div key={scores.user_name}>
                    {scores.user_name}:{scores.score}
                  </div>
                );
              })}
            </div>
            <CanvasAndChat>
              <div
                style={{
                  width: '50vw',
                  cursor: 'crosshair',
                  height: '100%',
                }}
              >
                <canvas
                  className="border"
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
              <Chat className="border">
                <Messages className="border">
                  <PerfectScrollbar>
                    {receievedMessage.map((message, index) => (
                      <div
                        className="border"
                        key={message.time}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? '#FDF7F1' : '#007ea7',
                          borderRadius: '7px',
                        }}
                      >
                        {message.user_name} :{message.messages}
                      </div>
                    ))}
                  </PerfectScrollbar>
                </Messages>
                <input
                  placeholder="Type here!"
                  value={sendingMessage}
                  onInput={(e) =>
                    setSendingMessage((e.target as HTMLInputElement).value)
                  }
                  onKeyDown={handleKeyDown}
                />
              </Chat>
            </CanvasAndChat>
          </MainDiv>
        </ContainingDiv>
      </DivContainer>
    </>
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
