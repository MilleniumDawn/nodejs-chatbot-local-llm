// client.js
import { io } from "https://cdn.skypack.dev/socket.io-client@4";

const socket = io();

let botMessageDiv; // Declare a variable to hold the current bot message div

function sendMessage() {
    const message = document.getElementById("input").value;
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML += `<div class="user">You: ${message}</div>`;
    botMessageDiv = document.createElement("div"); // Create a new div for the bot message
    botMessageDiv.className = "bot"; // Set the class name of the bot message div
    messagesDiv.appendChild(botMessageDiv); // Append the bot message div to the messages div
    socket.emit("user message", message);
    document.getElementById("input").value = "";
}

document.getElementById("input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); // Prevents the default action of the enter key
        sendMessage();
    }
});

socket.on("bot message", (msg) => {
    botMessageDiv.innerHTML += msg; // Append the chunk of text to the current bot message div
    const messagesDiv = document.getElementById("messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
});

export function handleSendButtonClick() {
    sendMessage();
}
