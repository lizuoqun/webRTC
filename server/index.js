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

  // 接听
  sock.on("acceptCall", (roomId) => {
    io.to(roomId).emit("acceptCall");
  });

  // 拒绝
  sock.on("refuseCall", (roomId) => {
    io.to(roomId).emit("refuseCall");
  });

  // 发送Offer
  sock.on("sendOffer", ({ roomId, offer }) => {
    io.to(roomId).emit("sendOffer", offer);
  });

  // 接收Answer
  sock.on("sendAnswer", ({ roomId, answer }) => {
    io.to(roomId).emit("sendAnswer", answer);
  });

  // 收到candidate信息
  sock.on("sendIceCandidate", ({ roomId, candidate }) => {
    io.to(roomId).emit("sendIceCandidate", candidate);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
