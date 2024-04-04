const {Server } = require('socket.io');

const io = new Server(8001 , {
    cors : {origin: '*',}
});


const emailToSocketId = new Map();
const socketToEmail = new Map();




io.on("connection",(socket) => {
    console.log(`Socket Connected ${socket.id}`);
    socket.on('room:join',data =>{
        console.log(data);
        const{email , room} = data;
        emailToSocketId.set(email , socket.id);
        socketToEmail.set(socket.id , email);


        io.to(room).emit('user:joined',{email , id:socket.id});
        socket.join(room);
        io.to(socket.id).emit('room:join',data);
    })

    socket.on('user:call',({to , offer})=>{
        io.to(to).emit('incomming:call',{from : socket.id , offer});
    })

    socket.on('call:acepted',({to , ans})=>{
        io.to(to).emit('call:acepted',{from : socket.id , ans});
        console.log("Call Accepted");
    })

    socket.on('peer:nego:needed' ,({to , offer})=>{
        io.to(to).emit('peer:nego:needed',{from : socket.id , offer});
        console.log("Nego recived Done")
    })

    socket.on('peer:nego:done',({to , ans})=>{
        io.to(to).emit('peer:nego:final',{from : socket.id , ans});
        console.log("Nego Send Done")
    })
})

console.log('ALl GOod');
