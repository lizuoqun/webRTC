const socket = require("socket.io");
const http = require("http");
const server = http.createServer();

const io = socket(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (sock) => {
  console.log("connection");
  sock.emit("connectionSuccess");

  sock.on("joinRoom", (roomId) => {
    console.log("joinRoom", roomId);
    sock.join(roomId);
  });

  // 向当前房间中其他的用户广播
  sock.on("call", (roomId) => {
    io.to(roomId).emit("call");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
