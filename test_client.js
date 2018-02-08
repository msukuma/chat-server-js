const { Socket } = require('net');
const {
  DATA,
  END,
  MESSAGE,
  SESSION,
  PORT,
  HOST, } = require('./constants');
const port = process.argv[2] || PORT;
const host = process.argv[3] || HOST;
const userId = 'userId-' + Math.floor(Math.random() * 1000).toString();

const alive = () => setTimeout(() => {
  log('still alive');
  alive();
}, 2500);

const socket = new Socket({ readable: true, writeable: true });

socket.on('connect', () => {
  console.log('client connected');

  //request session
  let sReq = {
    type: SESSION,
    userId: userId,
  };

  socket.write(JSON.stringify(sReq));
  console.log('session request sent');
});

socket.on(DATA, (c) => {
  console.log(c.toString());
});

socket.on(END, () => {
  process.exit(1);
});

socket.connect(port, host);

process.stdin.on(DATA, c => {
  let data = {
    type: MESSAGE,
    content: c.toString(),
    from: userId,
    timestamp: new Date().toISOString(),
  };

  socket.write(JSON.stringify(data));
  console.log('message sent');
});

process.on('SIGINT', () => {
  socket.destroy();
  process.exit(1);
});
