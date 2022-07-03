import 'react-perfect-scrollbar/dist/css/styles.css';
import Head from 'next/head';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import io from 'socket.io-client';
import styled from 'styled-components';

const Main = styled.div`
  background-color: red;
`;

const Chat = styled.div``;
const DivContainer = styled.div`
  display: flex;
  max-width: 100vw;
  max-height: 100vh;
`;
const Messages = styled.div`
  background-color: blue;
  overflow-y: scroll;
  height: 95%;
  ::-webkit-scrollbar {
    display: none;
  }
`;
let socket;
export default function Home(props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const mainId = useRef('');
  const [canvasstate, setCanvasstate] = useState(false);
  const [listOfUsers, setListOfUsers] = useState([]);
  const [room, setRoom] = useState('1');
  const [roomlist, setRoomlist] = useState([{ room: '1' }]);
  const [canvascontext, setCanvascontext] = useState('');
  const [id, setId] = useState('');
  const [stateList, setStateList] = useState();
  const [name, setName] = useState('');
  const [list, setList] = useState([]);
  //  CANVAS FUNCTIONS FOR DRAWING DELETING
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.5;
    canvas.height = window.innerHeight * 0.5;
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
    const socketInitializer = async () => {
      await fetch('/api/socket');
      socket = io();
      socket.on('connect', () => {
        console.log('connected');
      });
      socket.on('connect', () => {
        mainId.current = socket.id;
        setId(socket.id);
      });

      socket.on('message', (data) => {
        setList([...list, data]);
      });
      socket.on('users', (data) => {
        console.log('this is the data' + data);
        setListOfUsers([...listOfUsers, data]);
      });
      socket.on('canvasState', (data) => {
        if (canvasstate === true) {
          const canvas1 = canvasRef.current;
          const context1 = canvas1.getContext('2d');
          context1.clearRect(0, 0, canvas1.width, canvas1.height);
          setCanvasstate(false);
        } else {
          setStateList(data);
        }
      });
      socket.on('reconnect_error', (err) => {
        console.log(`connect_error due to ${err.message}`);
      });
      console.log('hello');
      socket.emit('join-room', room, props.user ? props.user.username : id);
      // return () => {
      //   socket.off('connect');
      //   socket.off('disconnect');
      //   socket.off('pong');
      // };
    };
    socketInitializer().catch(() => {
      console.log('error');
    });
  }, []);
  function startDrawing({ nativeEvent }) {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  }
  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL();
    socket.emit('canvas', imgData, room);
  };
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
  };
  // setting Canvas for other users

  // getting message

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleChatpost();
    }
  };
  const handleKeyDown1 = (event) => {
    if (event.key === 'Enter') {
      const array = [...roomlist, { room: room }];
      const lastRoom = array[array.length - 2].room;
      socket.emit('leave-room', lastRoom);
      setRoomlist([...roomlist, { room: room }]);
      deleteCanvas();
      setList([]);
      socket.emit('join-room', room, props.user ? props.user.username : id);
      console.log(room);
    }
  };

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Main>chat</Main>
      <input
        value={room}
        onInput={(e) => setRoom(e.target.value)}
        onKeyDown={handleKeyDown1}
      />
      {props.user && (
        <Link href="/user/private-profile">{props.user.username}</Link>
      )}
      <button
        onClick={() => {
          socket.emit(
            'canvas',
            'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            room,
          );
          const array = [...roomlist, { room: room }];
          const lastRoom = array[array.length - 2].room;
          socket.emit('leave-room', lastRoom);
          setRoomlist([...roomlist, { room: room }]);
          socket.emit('join-room', room, props.user ? props.user.username : id);
          console.log(room);
          deleteCanvas();
        }}
      >
        enter room
      </button>
      <DivContainer>
        <div style={{ border: '1px solid black', width: '50%', height: '50%' }}>
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
              {list.map((name1) => (
                <div key={name1.post}>
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
          <button
            onClick={() => {
              handleChatpost();
            }}
          >
            send
          </button>
        </Chat>
      </DivContainer>
    </>
  );
}
