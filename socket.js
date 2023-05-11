const WebSoket = require("ws");
const SocketIO = require("socket.io");
const { removeRoom } = require("./services/index");

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: "/socket.io" });
  app.set("io", io);
  const room = io.of("/room");
  const chat = io.of("/chat");

  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);

  chat.use(wrap(sessionMiddleware));

  room.on("connection", (socket) => {
    console.log("room 네임스페이스에 접속");
    socket.on("disconnect", () => {
      console.log("room 네임스페이스 접속 해제");
    });
  });

  chat.on("connection", (socket) => {
    console.log("chat 네임스페이스에 접속");
    socket.on("join", (data) => {
      console.log("data", data);
      socket.join(data); // 네임페이스 아래 존재하는 방에 접속
      socket.to(data).emit("join", {
        user: "system",
        chat: `${socket.request.session.color}님이 입장하셨습니다`,
      });
    });

    socket.on("disconnect", async () => {
      console.log("chat 네임스페이스 접속 해제");
      const { referer } = socket.request.headers;
      const roomId = new URL(referer).pathname.split("/").at(-1);
      const currentRoom = chat.adapter.rooms.get(roomId);
      const userCount = currentRoom?.size || 0;
      if (userCount === 0) {
        // 유저가 0명이면 방 삭제
        await removeRoom(roomId);
        room.emit("removeRoom", roomId);
        console.log("방 제거 요청 성공");
      } else {
        socket.to(roomId).emit("exit", {
          user: "system",
          chat: `${socket.request.session.color}님이 퇴장하셨습니다`,
        });
      }
    });
  });
};

// module.exports = (server) => {
//   const wss = new WebSoket.Server({ server });

//   wss.on("connection", (ws, req) => {
//     // 웹소켓 연결시
//     const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
//     console.log("새로운 클라이언트 접속", ip);
//     ws.on("message", (message) => {
//       // 클라이언트로부터 메세지
//       console.log(message.toString());
//     });
//     ws.on("error", (error) => {
//       console.error(error);
//     });
//     ws.on("close", () => {
//       console.log("클라이언트 접속 해제", ip);
//       clearInterval(ws.interval);
//     });
//     ws.interval = setInterval(() => {
//       if (ws.readyState === ws.OPEN) {
//         ws.send("서버에서 클라이언트로 메세지를 보냅니다");
//       }
//     }, 3000);
//   });
// };
