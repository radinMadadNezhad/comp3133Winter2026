$(document).ready(function() {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('chatUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    $('#user-display').text(`Welcome, ${user.firstname} ${user.lastname}`);

    // Initialize Socket.io
    const socket = io();

    // Current room
    let currentRoom = null;

    // Private chat state
    let privateChatUser = null;

    // Typing timeouts
    let typingTimeout = null;
    let privateTypingTimeout = null;

    // Load available rooms
    loadRooms();

    // Load rooms from server
    function loadRooms() {
        fetch('/api/rooms')
            .then(response => response.json())
            .then(rooms => {
                const roomList = $('#room-list');
                roomList.empty();
                rooms.forEach(room => {
                    roomList.append(`
                        <li data-room="${room}">
                            <i class="fas fa-hashtag me-2"></i>${room}
                        </li>
                    `);
                });
            })
            .catch(error => console.error('Error loading rooms:', error));
    }

    // Show room chat view
    function showRoomChat() {
        $('#private-chat-section').css('display', 'none');
        if (currentRoom) {
            $('#room-chat-section').css('display', 'flex');
        }
        privateChatUser = null;
    }

    // Show private chat view
    function showPrivateChat(username) {
        privateChatUser = username;
        $('#room-chat-section').css('display', 'none');
        $('#private-chat-section').css('display', 'flex');
        $('#private-chat-user').text(username);
        $('#private-chat-messages').empty();
        $('#private-typing-indicator').removeClass('active');

        // Load message history
        fetch(`/api/private-messages/${encodeURIComponent(user.username)}/${encodeURIComponent(username)}`)
            .then(response => response.json())
            .then(messages => {
                messages.forEach(msg => displayPrivateMessage(msg));
                scrollToBottomPrivate();
            })
            .catch(error => console.error('Error loading private messages:', error));
    }

    // Join a room
    $('#room-list').on('click', 'li', function() {
        const room = $(this).data('room');

        // Leave current room if any
        if (currentRoom) {
            socket.emit('leaveRoom');
        }

        // Update UI
        $('#room-list li').removeClass('active');
        $(this).addClass('active');

        currentRoom = room;

        // Join new room
        socket.emit('joinRoom', { username: user.username, room: room });

        // Update display
        $('#current-room-display').text(`Room: ${room}`);
        $('#no-room-message').hide();
        $('#chat-messages').empty();
        $('#room-chat-section').css('display', 'flex');
        $('#private-chat-section').css('display', 'none');
        $('#leave-room-section').show();
        privateChatUser = null;

        // Load previous messages
        loadMessages(room);
    });

    // Load messages for a room
    function loadMessages(room) {
        fetch(`/api/messages/${encodeURIComponent(room)}`)
            .then(response => response.json())
            .then(messages => {
                messages.forEach(msg => {
                    displayMessage(msg);
                });
                scrollToBottom();
            })
            .catch(error => console.error('Error loading messages:', error));
    }

    // Display a room message
    function displayMessage(msg) {
        const messagesContainer = $('#chat-messages');
        let messageClass = 'other';

        if (msg.from_user === 'System') {
            messageClass = 'system';
        } else if (msg.from_user === user.username) {
            messageClass = 'own';
        }

        const time = new Date(msg.date_sent).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        let messageHtml = '';

        if (messageClass === 'system') {
            messageHtml = `
                <div class="message system">
                    <div class="message-content">${msg.message}</div>
                </div>
            `;
        } else {
            messageHtml = `
                <div class="message ${messageClass}">
                    ${messageClass === 'other' ? `<div class="message-sender">${msg.from_user}</div>` : ''}
                    <div class="message-content">${escapeHtml(msg.message)}</div>
                    <div class="message-meta">${time}</div>
                </div>
            `;
        }

        messagesContainer.append(messageHtml);
    }

    // Display a private message
    function displayPrivateMessage(msg) {
        const messagesContainer = $('#private-chat-messages');
        const messageClass = msg.from_user === user.username ? 'own' : 'other';

        const time = new Date(msg.date_sent).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        const messageHtml = `
            <div class="message ${messageClass}">
                ${messageClass === 'other' ? `<div class="message-sender">${msg.from_user}</div>` : ''}
                <div class="message-content">${escapeHtml(msg.message)}</div>
                <div class="message-meta">${time}</div>
            </div>
        `;

        messagesContainer.append(messageHtml);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Scroll to bottom of room messages
    function scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Scroll to bottom of private messages
    function scrollToBottomPrivate() {
        const messagesContainer = document.getElementById('private-chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Send room message
    function sendMessage() {
        const message = $('#message-input').val().trim();

        if (message && currentRoom) {
            socket.emit('chatMessage', { message: message });
            $('#message-input').val('');
            socket.emit('stopTyping');
        }
    }

    // Send private message
    function sendPrivateMessage() {
        const message = $('#private-message-input').val().trim();

        if (message && privateChatUser) {
            socket.emit('privateMessage', { to_user: privateChatUser, message: message });
            $('#private-message-input').val('');
            socket.emit('privateStopTyping', { to_user: privateChatUser });
        }
    }

    // Room send button click
    $('#send-btn').on('click', sendMessage);

    // Room enter key to send
    $('#message-input').on('keypress', function(e) {
        if (e.which === 13) {
            sendMessage();
        }
    });

    // Private send button click
    $('#private-send-btn').on('click', sendPrivateMessage);

    // Private enter key to send
    $('#private-message-input').on('keypress', function(e) {
        if (e.which === 13) {
            sendPrivateMessage();
        }
    });

    // Room typing indicator
    $('#message-input').on('input', function() {
        socket.emit('typing');

        clearTimeout(typingTimeout);

        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping');
        }, 1000);
    });

    // Private typing indicator
    $('#private-message-input').on('input', function() {
        if (privateChatUser) {
            socket.emit('privateTyping', { to_user: privateChatUser });

            clearTimeout(privateTypingTimeout);

            privateTypingTimeout = setTimeout(() => {
                socket.emit('privateStopTyping', { to_user: privateChatUser });
            }, 1000);
        }
    });

    // Click on a user in the sidebar to open private chat
    $('#user-list').on('click', 'li', function() {
        const clickedUsername = $(this).data('username');
        if (clickedUsername && clickedUsername !== user.username) {
            showPrivateChat(clickedUsername);
        }
    });

    // Back to room button
    $('#back-to-room-btn').on('click', function() {
        showRoomChat();
    });

    // Leave room
    $('#leave-room-btn').on('click', function() {
        if (currentRoom) {
            socket.emit('leaveRoom');

            // Reset UI
            currentRoom = null;
            privateChatUser = null;
            $('#room-list li').removeClass('active');
            $('#current-room-display').text('Select a room to start chatting');
            $('#no-room-message').show();
            $('#room-chat-section').css('display', 'none');
            $('#private-chat-section').css('display', 'none');
            $('#chat-messages').empty();
            $('#leave-room-section').hide();
            $('#user-list').empty();
        }
    });

    // Logout
    $('#logout-btn').on('click', function() {
        if (currentRoom) {
            socket.emit('leaveRoom');
        }
        localStorage.removeItem('chatUser');
        window.location.href = 'login.html';
    });

    // Socket event listeners

    // Receive room message
    socket.on('message', function(msg) {
        displayMessage(msg);
        scrollToBottom();
    });

    // Update room users
    socket.on('roomUsers', function(users) {
        const userList = $('#user-list');
        userList.empty();
        users.forEach(username => {
            const isYou = username === user.username;
            userList.append(`
                <li data-username="${username}" class="${isYou ? '' : 'clickable-user'}">
                    ${username}${isYou ? ' (You)' : ''}
                </li>
            `);
        });
    });

    // Room typing indicator
    socket.on('typing', function(data) {
        $('#typing-user').text(data.username);
        $('#typing-indicator').addClass('active');
    });

    // Room stop typing indicator
    socket.on('stopTyping', function() {
        $('#typing-indicator').removeClass('active');
    });

    // Receive private message
    socket.on('privateMessage', function(msg) {
        // If the private chat with this user is open, display the message
        if (privateChatUser && (msg.from_user === privateChatUser || msg.from_user === user.username)) {
            displayPrivateMessage(msg);
            scrollToBottomPrivate();
        }
    });

    // Private typing indicator
    socket.on('privateTyping', function(data) {
        if (privateChatUser && data.username === privateChatUser) {
            $('#private-typing-user').text(data.username);
            $('#private-typing-indicator').addClass('active');
        }
    });

    // Private stop typing indicator
    socket.on('privateStopTyping', function(data) {
        if (privateChatUser && data.username === privateChatUser) {
            $('#private-typing-indicator').removeClass('active');
        }
    });

    // Handle connection errors
    socket.on('connect_error', function(error) {
        console.error('Connection error:', error);
    });

    // Handle disconnection
    socket.on('disconnect', function() {
        console.log('Disconnected from server');
    });
});
