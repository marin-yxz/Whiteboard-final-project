import 'react-perfect-scrollbar/dist/css/styles.css';
import _ from 'lodash';
import Head from 'next/head';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { io } from 'socket.io-client';
import styled from 'styled-components';

const Main = styled.div`
  background-color: red;
`;

const Chat = styled.div`
  height: 80vh;
`;
const DivContainer = styled.div`
  display: flex;
  max-width: 100vw;
  max-height: 100vh;
  justify-content: space-between;
  padding-left: 10%;
  padding-right: 10%;
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
const Users = styled.div`
  display: flex;
  flex-direction: row;
`;
const socket = io('http://localhost:8000', {
  transports: ['websocket'],
});
export default function Home(props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const mainId = useRef('');
  const [join, setJoin] = useState(true);
  const [canvasstate, setCanvasstate] = useState(false);
  const [room, setRoom] = useState(props.link.gameId);
  const [canvascontext, setCanvascontext] = useState('');
  const [id, setId] = useState('');
  const [stateList, setStateList] = useState();
  const [listOfUsers, setListOfUsers] = useState([]);
  const [drawing, setDrawing] = useState(0);
  function startDrawing({ nativeEvent }) {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    const b = setInterval(() => {
      const canvas = canvasRef.current;
      const imgData = canvas.toDataURL();
      socket.emit('canvas', imgData, room);
      if (drawing === 1) {
        clearInterval(b);
      }
    }, 100);
  }

  // When user stops drawing close mouse function
  const finishDrawing = () => {
    contextRef.current.closePath();
    setDrawing(1);
    setIsDrawing(false);
  };
  // Reset Canvas to Blank
  const deleteCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const image = new Image();
    image.onload = function () {
      canvascontext.drawImage(image, 0, 0);
    };
    image.src =
      'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }, [canvascontext]);
  // Canvas Drawing
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
  //  canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.5;
    canvas.height = window.innerHeight * 0.8;
    canvas.style = `${window.innerWidth}px`;
    canvas.style = `${window.innerHeight}px`;
    const context = canvas.getContext('2d');
    setCanvascontext(context);
    context.lineCap = 'round';
    context.strokeStyle = 'red';
    context.lineWidth = 5;
    contextRef.current = context;
  }, []);

  useEffect(() => {
    if (props.user) {
      socket.on('connect', () => {
        mainId.current = socket.id;
        setId(socket.id);
      });
      socket.emit('join-room', room, [
        ...listOfUsers,
        { id: props.user ? props.user.username : id },
        { state: false },
      ]);
    }
  }, [props.user]);
  useEffect(() => {
    if (canvasstate === true) {
      deleteCanvas();
      setCanvasstate(true);
    } else {
      const image = new Image();
      image.onload = function () {
        canvascontext.drawImage(image, 0, 0);
      };
      image.src = stateList;
    }
  }, [canvascontext, canvasstate, deleteCanvas, stateList]);
  //   //  CANVAS FUNCTIONS FOR DRAWING DELETING

  //  socket io useStates
  const [name, setName] = useState('');
  const [list, setList] = useState([]);

  //  HANDLING POSTING TO SOCKET.IO
  // chat messages
  const handleChatpost = () => {
    socket.emit(
      'chat',
      { post: name, id: props.user ? props.user.username : id },
      room,
    );
    setList([
      ...list,
      { post: name, id: props.user ? props.user.username : id },
    ]);
    socket.emit('join-room', room, [...listOfUsers, { p: name }]);
  };
  socket.on('message', (data) => {
    setList([...list, data]);
  });
  socket.on('users', (data) => {
    setListOfUsers(data);
  });
  socket.on('userList', (data) => {
    console.log(data);
  });
  socket.on('canvasState', (data) => {
    if (canvasstate === true) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      setCanvasstate(false);
    } else {
      setStateList(data);
    }
  });
  socket.on('reconnect_error', (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleChatpost();
    }
  };
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DivContainer>
        <div>
          {listOfUsers.map((user, index) => (
            <Users
              key={user.id}
              style={{
                backgroundColor: user.state ? 'blue' : 'red',
                display: 'flex',
              }}
            >
              <div>{user.id}:</div>
              {user.state && user.id === (props.user ? props.user.username : id)
                ? user.word
                : ''}
              <div>{listOfUsers[0]?.gamestate ? '' : 'ready'}</div>
              {user.id === (props.user ? props.user.username : id) &&
              !user.gamestate &&
              index === 0 ? (
                <button
                  onClick={() => {
                    socket.emit('join-room', room, [
                      {
                        id: props.user ? props.user.username : id,
                        state: true,
                        gamestate: true,
                      },
                    ]);
                  }}
                >
                  start
                </button>
              ) : (
                ''
              )}
              {user.id !== (props.user ? props.user.username : id) &&
              !user.gamestate &&
              index === 0 ? (
                <div></div>
              ) : (
                ''
              )}
            </Users>
          ))}
          <button
            style={{ display: join ? 'visible' : 'none' }}
            onClick={() => {
              console.log(
                'this is the list ',
                props.user ? props.user.username : id,
              );
              setListOfUsers([
                ...listOfUsers,
                { id: props.user ? props.user.username : id },
              ]);
              socket.emit('join-room', room, [
                {
                  id: props.user ? props.user.username : id,
                  state: false,
                },
              ]);
              setJoin(false);
            }}
          >
            join game
          </button>
        </div>
        <div
          style={{
            border: '1px solid black',
            width: '50vw',
            cursor: 'crosshair',
          }}
        >
          <canvas
            onMouseDown={(nativeEvent) => {
              startDrawing(nativeEvent);
            }}
            onMouseUp={(nativeEvent) => {
              finishDrawing(nativeEvent);
            }}
            onMouseMove={draw}
            ref={canvasRef}
          />
        </div>
        <Chat>
          <Messages>
            <PerfectScrollbar>
              {list.map((name1, index) => (
                <div
                  key={name1.post}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#80ced7' : '#007ea7',
                  }}
                >
                  {name1.id}:{name1.post}
                </div>
              ))}
            </PerfectScrollbar>
          </Messages>
          <input
            onChange={(e) => {
              setName(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          {/* <button
            onClick={() => {
              handleChatpost();
            }}
          >
            send
          </button> */}
        </Chat>
      </DivContainer>
    </>
  );
}
export function getServerSideProps(context) {
  const gameUrl = context.query;
  console.log(gameUrl);
  return {
    props: {
      link: gameUrl,
    },
  };
}
