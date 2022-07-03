import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { getUserByValidSessionToken } from '../../util/database';

let socket = io();

export default function Home(props) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [drawing, setDrawing] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false); // state to track when user clicks to draw
  const [sendingMessage, setSendingMessage] = useState(); // messages that we want to send to socket
  const [receievedMessages, setReceievedMessages] = useState([]); // messages that we receive from socket
  const [players, setPlayers] = useState([]);
  // INITALIZE SOCKET AND HANDLING ALL RESPONSES FROM SOCKET IF CONNECTED

  useEffect(() => {
    // wait for props.user from nextjs backend to come if it's delayed
    if (props.user) {
      const socketInitializer = async () => {
        await fetch('/api/socket').finally(() => {
          socket.on('connect', () => {
            console.log('connected');
          });

          return () => socket.emit('end');
        });
      };
      socketInitializer().catch(() => {});
    }
  }, [props.user]);

  useEffect(() => {
    console.log(players);
  }, [players]);
  // fuction to send a message to socket with atributes: message that we send our name and our room
  useEffect(() => {
    if (props.user) {
      setPlayers((previousState) => {
        console.log(new Date());
        const newState = [
          ...previousState,
          { player_name: props.user.username, timestamp: new Date() },
        ];
        return _.uniqBy(newState, 'player_name');
      });
      socket.emit('room', props.link.gameId, [
        {
          player_name: props.user.username,
          timestamp: new Date(),
        },
      ]);
    }
  }, [props.user]);
  useEffect(() => {
    socket
      .off('receieve-message')
      .on('receive-message', (receivedMessageFromSocket) => {
        setReceievedMessages((previousState) => {
          const newState = [...previousState, ...receivedMessageFromSocket];
          return _.uniqBy(newState, 'timestamp');
        });
      });
    socket.off('receieve-users').on('receieve-users', (playersFromSocket) => {
      setPlayers((previousState) => {
        const newState = [...previousState, ...playersFromSocket];
        return _.uniqBy(newState, 'player_name');
      });
    });
    socket.off('receive-canvas').on('receive-canvas', (canvas) => {
      const canvas1 = canvasRef.current;
      const context = canvas1.getContext('2d');
      const image = new Image();
      image.onload = function () {
        context.drawImage(image, 0, 0);
      };

      image.src = canvas;
    });
    return () => {
      socket.off('receieve-message');
      socket.off('receieve-users');
      socket.off('receive-canvas');
    };
  }, [socket]);

  function sendMessageToChat() {
    const timestamp = Number(new Date());
    setReceievedMessages((previousState) => {
      const newState = [
        ...previousState,
        {
          message: sendingMessage,
          username: props.user.username,
          timestamp: timestamp,
        },
      ];
      return _.uniqBy(newState, 'timestamp');
    });
    socket.emit(
      'message',
      [
        {
          message: sendingMessage,
          username: props.user.username,
          timestamp: timestamp,
        },
      ],
      props.link.gameId,
    );
  }

  // canvas setup and different functions tied to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.5;
    canvas.height = window.innerHeight * 0.8;
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
    setDrawing(1);
    setIsDrawing(false);
  };
  function startDrawing({ nativeEvent }) {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    const b = setInterval(() => {
      const canvas = canvasRef.current;
      const imgData = canvas.toDataURL();
      socket.emit('canvas', imgData, props.link.gameId);
      console.log('im drawing');
      if (drawing === 1) {
        clearInterval(b);
        console.log('i stopped');
      }
    }, 100);
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

  return (
    <>
      {' '}
      {players.map((player_id) => {
        return (
          <div key={player_id.player_name}>
            <div>{player_id.player_name}</div>
          </div>
        );
      })}
      {receievedMessages.map((Chat) => {
        return (
          <div key={Chat.username + ':' + Chat.message + Chat.timestamp}>
            <div>
              {Chat.username}:{Chat.message}
            </div>
          </div>
        );
      })}
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
    </>
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
