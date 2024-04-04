const http = require('http');
const { Server } = require('ws');

const httpServer = http.createServer();
const wss = new Server({ server: httpServer });

const emailToSocketId = new Map();
const socketToEmail = new Map();

wss.on('connection', (socket, req) => {
  console.log(`Socket Connected ${socket._socket.remoteAddress}:${socket._socket.remotePort}`);

  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    const { event, payload } = message;

    switch (event) {
      case 'room:join':
        const { email, room } = payload;
        emailToSocketId.set(email, `${socket._socket.remoteAddress}:${socket._socket.remotePort}`);
        socketToEmail.set(`${socket._socket.remoteAddress}:${socket._socket.remotePort}`, email);

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client !== socket && client.pingInterval) {
            const recipientEmail = socketToEmail.get(client._socket.remoteAddress + ':' + client._socket.remotePort);
            if (recipientEmail && recipientEmail === room) {
              client.send(JSON.stringify({ event: 'user:joined', payload: { email, id: `${socket._socket.remoteAddress}:${socket._socket.remotePort}` } }));
            }
          }
        });
        socket.send(JSON.stringify({ event: 'room:join', payload: payload }));
        break;

      case 'user:call':
        const {to,offer} = payload;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client !== socket && client.pingInterval && socketToEmail.get(client._socket.remoteAddress + ':' + client._socket.remotePort) === to) {
            client.send(JSON.stringify({ event: 'incomming:call', payload: { from: `${socket._socket.remoteAddress}:${socket._socket.remotePort}`, offer } }));
          }
        });
        break;

      case 'call:acepted':
        const {to,ans} = payload;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client !== socket && client.pingInterval && socketToEmail.get(client._socket.remoteAddress + ':' + client._socket.remotePort) === to) {
            client.send(JSON.stringify({ event: 'call:acepted', payload: { from: `${socket._socket.remoteAddress}:${socket._socket.remotePort}`, ans } }));
          }
        });
        break;

      case 'peer:nego:needed':
        const {to,offer} = payload;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client !== socket && client.pingInterval && socketToEmail.get(client._socket.remoteAddress + ':' + client._socket.remotePort) === to) {
            client.send(JSON.stringify({ event: 'peer:nego:needed', payload: { from: `${socket._socket.remoteAddress}:${socket._socket.remotePort}`, offer } }));
          }
        });
        break;

      case 'peer:nego:done':
        const { to, ans } = payload;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client !== socket && client.pingInterval && socketToEmail.get(client._socket.remoteAddress + ':' + client._socket.remotePort) === to) {
            client.send(JSON.stringify({ event: 'peer:nego:final', payload: { from: `${socket._socket.remoteAddress}:${socket._socket.remotePort}`, ans } }));
          }
        });
        break;
    }
 