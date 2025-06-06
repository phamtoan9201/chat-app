const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
app.use(express.static('public')); // thư mục chứa giao diện

const users = {}; // { roomName: [ { id, username } ] }
const userLastMessageTime = {}; // lưu thời gian gửi tin cuối cùng

const bannedWords = ['điên', 'khùng', 'ngu']; // từ cấm

io.on('connection', (socket) => {
  console.log('🔌 Người dùng kết nối:', socket.id);

  socket.on('joinRoom', ({ username, room }) => {
    socket.username = username;
    socket.room = room;
    socket.join(room);

    if (!users[room]) users[room] = [];
    users[room].push({ id: socket.id, username });

    io.to(room).emit('userList', users[room]);
    console.log(`${username} đã vào phòng ${room}`);
  });

  socket.on('chat message', ({ room, user, msg }) => {
    const now = Date.now();
    const lastTime = userLastMessageTime[socket.id] || 0;
    const spamInterval = 2000;

    if (now - lastTime < spamInterval) {
      socket.emit('messageBlocked', 'Bạn gửi tin quá nhanh, vui lòng chờ một chút!');
      return;
    }

    userLastMessageTime[socket.id] = now;

    const lowerMsg = msg.toLowerCase();
    const hasBannedWord = bannedWords.some(word => lowerMsg.includes(word));
    if (hasBannedWord) {
      socket.emit('messageBlocked', 'Tin nhắn chứa nội dung không phù hợp và đã bị chặn!');
      return;
    }

    const id = uuidv4();
    io.to(room).emit('chat message', { id, user, msg });
  });

  socket.on('deleteMessage', ({ id, room }) => {
    io.to(room).emit('deleteMessage', id);
  });

  socket.on('disconnect', () => {
    const room = socket.room;
    if (room && users[room]) {
      users[room] = users[room].filter(u => u.id !== socket.id);
      io.to(room).emit('userList', users[room]);
    }
    console.log('❌ Ngắt kết nối:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
