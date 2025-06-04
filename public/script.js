const socket = io();

let currentRoom = '';
let username = '';

function joinRoom() {
  username = document.getElementById('username').value;
  currentRoom = document.getElementById('room').value;

  if (!username || !currentRoom) {
    alert('Vui lòng nhập tên và tên phòng!');
    return;
  }

  socket.emit('joinRoom', { username, room: currentRoom });

  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'block';
  document.getElementById('room-name').innerText = `Phòng: ${currentRoom}`;
}

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', { room: currentRoom, user: username, msg: input.value });
    input.value = '';
  }
});

socket.on('chat message', function ({ id, user, msg }) {
    const item = document.createElement('li');
    item.textContent = `${user}: ${msg}`;
    item.setAttribute('data-id', id);
  
    if (user === username) {
      const btn = document.createElement('button');
      btn.textContent = '❌';
      btn.onclick = () => {
        socket.emit('deleteMessage', { id, room: currentRoom });
      };
      item.appendChild(btn);
    }
  
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  socket.on('userList', (users) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u.username;
      userList.appendChild(li);
    });
  });
  
  socket.on('deleteMessage', (id) => {
    const allItems = document.querySelectorAll('#messages li');
    allItems.forEach(item => {
      if (item.getAttribute('data-id') === id) {
        item.remove();
      }
    });
  
  socket.on('messageBlocked', (msg) => {
    const notice = document.getElementById('notice');
    notice.textContent = msg;
    setTimeout(() => {
      notice.textContent = '';
    }, 3000);
  });
  });
  
  
  