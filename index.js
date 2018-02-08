const ChatServer = require('./server');
const {
  PORT,
  HOST, } = require('./constants');
const port = process.argv[2] || PORT;
const host = process.argv[3] || HOST;

const server = new ChatServer();

server.listen(port, host);
