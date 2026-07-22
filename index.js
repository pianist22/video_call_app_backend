const express = require('express');
const bodyParser = require('body-parser');
const {Server} = require('socket.io');

const io = new Server({
    cors: true,
});
const app = express();

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();


io.on('connection', (socket) => {
//   console.log("New Connection");
  socket.on("join-room",(data)=>{
    const {emailId,roomId} = data;
    console.log("User",emailId,"joined room",roomId);
    emailToSocketMapping.set(emailId,socket.id);
    socketToEmailMapping.set(socket.id,emailId);
    socket.join(roomId);
    socket.emit("joined-room",{roomId});
    socket.broadcast.to(roomId).emit("user-joined",{emailId})
  });

  socket.on("send-offer",(data)=>{
    const {emailId,offer} = data;
    const fromEmail = socketToEmailMapping.get(socket.id); // this is Caller Email
    const socketId = emailToSocketMapping.get(emailId); // this is the Callee Socket Id
    
      socket.to(socketId).emit("receive-offer",{
        from: fromEmail,
        offer,
      });
    
  });

  socket.on("send-answer",(data)=>{
    const {emailId,answer} = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
      socket.to(socketId).emit("receive-answer",{
        answer,
      });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
      const socketId = emailToSocketMapping.get(to);

      if (socketId) {
          socket.to(socketId).emit("ice-candidate", {
              candidate
          });
      }
  });
});

app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

io.listen((8001));