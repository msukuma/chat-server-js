const { INFO } = require('./constants');
const ChatServer = require('./server');
const port = process.argv[2] || 56150;
const host = process.argv[3] || '127.0.0.1';

const server = new ChatServer();

server.listen(port, host, () => {
  server.log.info(`listening on ${JSON.stringify(server.address())}`);
});
