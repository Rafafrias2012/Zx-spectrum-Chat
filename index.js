const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Store connected users
let users = new Set();

io.on('connection', (socket) => {
  console.log('A user connected');

  let currentNickname = '';

  socket.on('login', (nickname) => {
    currentNickname = nickname;
    users.add(nickname);
    socket.emit('chat message', { sender: 'System', text: `Welcome, ${nickname}!` });
    socket.broadcast.emit('chat message', { sender: 'System', text: `${nickname} has joined the chat.` });
    io.emit('user list', Array.from(users));
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('change nickname', (newNickname) => {
    if (users.has(newNickname)) {
      socket.emit('chat message', { sender: 'System', text: 'This nickname is already taken.' });
    } else {
      users.delete(currentNickname);
      users.add(newNickname);
      io.emit('chat message', { sender: 'System', text: `${currentNickname} changed their nickname to ${newNickname}.` });
      currentNickname = newNickname;
      io.emit('user list', Array.from(users));
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    if (currentNickname) {
      users.delete(currentNickname);
      io.emit('chat message', { sender: 'System', text: `${currentNickname} has left the chat.` });
      io.emit('user list', Array.from(users));
    }
  });
});

http.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
        
