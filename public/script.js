const socket = io();

let currentRoom = '';
let username = '';
let roomPassword = '';

function joinRoom() {
  username = document.getElementById('username').value.trim();
  currentRoom = document.getElementById('room').value.trim();
  roomPassword = document.getElementById('roomPassword').value;

  if (!username || !currentRoom) {
    alert('Vui lòng nhập tên và tên phòng!');
    return;
  }

  // Gửi kèm mật khẩu phòng khi join
  socket.emit('joinRoom', { username, room: currentRoom, password: roomPassword });

  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'flex';
  document.getElementById('room-name').innerText = `Phòng: ${currentRoom}`;
}

// Xử lý form gửi tin nhắn
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit('chat message', { 
      room: currentRoom, 
      user: username, 
      msg: input.value.trim(), 
      type: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    input.value = '';
  }
});

// Hiển thị tin nhắn mới
socket.on('chat message', function ({ id, user, msg, type, time }) {
  const item = document.createElement('li');
  item.classList.add('message-item');
  item.setAttribute('data-id', id);

  if (user === username) {
    item.classList.add('own');
  }

  // Tên người gửi
  const sender = document.createElement('span');
  sender.className = 'sender';
  sender.textContent = user;

  // Nội dung tin nhắn
  const messageContent = document.createElement('div');
  messageContent.className = 'message-bubble';

  if (type === 'image') {
    const img = document.createElement('img');
    img.src = msg;
    img.style.maxWidth = '200px';
    img.style.borderRadius = '10px';
    messageContent.appendChild(img);
  } else {
    messageContent.textContent = msg;
  }

  // Thời gian gửi
  const timeSpan = document.createElement('span');
  timeSpan.className = 'message-time';
  timeSpan.textContent = time;

  item.appendChild(sender);
  item.appendChild(messageContent);
  item.appendChild(timeSpan);

  // Nếu là tin nhắn của chính mình, thêm nút xóa
  if (user === username) {
    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.className = 'delete-btn';
    btn.onclick = () => {
      socket.emit('deleteMessage', { id, room: currentRoom });
    };
    item.appendChild(btn);
  }

  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// Danh sách người dùng trong phòng
socket.on('userList', (users) => {
  const userList = document.getElementById('user-list');
  userList.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u.username;
    userList.appendChild(li);
  });
});

// Xóa tin nhắn theo id
socket.on('deleteMessage', (id) => {
  const allItems = document.querySelectorAll('#messages li');
  allItems.forEach(item => {
    if (item.getAttribute('data-id') === id) {
      item.remove();
    }
  });
});

// Hiện thông báo khi tin nhắn bị chặn
socket.on('messageBlocked', (msg) => {
  const notice = document.getElementById('notice');
  notice.textContent = msg;
  setTimeout(() => {
    notice.textContent = '';
  }, 3000);
});

/* --- Tính năng Emoji --- */
const btnEmoji = document.getElementById('btnEmoji');
const emojiPicker = document.getElementById('emoji-picker');

btnEmoji.addEventListener('click', () => {
  emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'flex' : 'none';
});

// Khi chọn emoji thì thêm vào input
emojiPicker.addEventListener('click', (e) => {
  if (e.target.classList.contains('emoji')) {
    input.value += e.target.textContent;
    input.focus();
  }
});

/* --- Tính năng gửi ảnh --- */
const btnImage = document.getElementById('btnImage');
const imageInput = document.getElementById('imageInput');

btnImage.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;

  // Kiểm tra file có phải ảnh không
  if (!file.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh hợp lệ!');
    return;
  }

  // Đọc file ảnh dưới dạng base64
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('chat message', {
      room: currentRoom,
      user: username,
      msg: reader.result,
      type: 'image',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };
  reader.readAsDataURL(file);

  imageInput.value = ''; // reset lại input
});
