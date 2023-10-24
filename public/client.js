import { io } from 'https://cdn.skypack.dev/socket.io-client@4';

const socket = io();

let botMessageDiv;  // Declare a variable to hold the current bot message div

function sendMessage() {
    const message = document.getElementById('input').value;
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML += `<div>You: ${message}</div>`;
    botMessageDiv = document.createElement('div');  // Create a new div for the bot message
    messagesDiv.appendChild(botMessageDiv);  // Append the bot message div to the messages div
    socket.emit('user message', message);
    document.getElementById('input').value = '';
}

socket.on('bot message', (msg) => {
    botMessageDiv.innerHTML += msg;  // Append the chunk of text to the current bot message div
});

document.getElementById('input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});


window.sendMessage = sendMessage;  // Expose the function to the global scope
