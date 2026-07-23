const express = require('express');
const bodyParser = require('body-parser');
const {Server} = require('socket.io');
const http = require("http");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

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

server.listen(8000, () => {
    console.log("Server is running on port 8000");
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
});
