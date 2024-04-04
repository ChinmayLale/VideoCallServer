const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static('public'));

const emailToSocketId = new Map();
const socketToEmail = new Map();

io.on('connection', (socket) => {
  console.log(`Socket Connected ${socket.id}`);
  socket.on('room:join', (data) => {
    console.log(data);
    const { email, room } = data;
    emailToSocketId.set(email, socket.id);
    socketToEmail.set(socket.id, email);

    socket.join(room);

    io.to(room).emit('user:joined', { email, id: socket.id });
    io.to(socket.id).emit('room:join', data);
  });

  socket.on('user:call', ({ to, offer }) => {
    io.to(to).emit('incomming:call', { from: socket.id, offer });
  });

  socket.on('call:acepted', ({ to, ans }) => {
    io.to(to).emit('call:acepted', { from: socket.id, ans });
    console.log('Call Accepted');
  });

  socket.on('peer:nego:needed', ({ to, offer }) => {
    io.to(to).emit('peer:nego:needed', { from: socket.id, offer });
    console.log('Nego recived Done');
  });

  socket.on('peer:nego:done', ({ to, ans }) => {
    io.to(to).emit('peer:nego:final', { from: socket.id, ans });
    console.log('Nego Send Done');
  });
});

const PORT = process.env.PORT || 8001;

server.listen(PORT, () => {
  console.log('All Good , Server Started');
});