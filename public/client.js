// client.js
import { io } from "https://cdn.skypack.dev/socket.io-client@4";

const socket = io();

let botMessageDiv; // Declare a variable to hold the current bot message div

async function fetchConfig() {
    const response = await fetch("/config");
    const config = await response.json();
    document.querySelector(".modelName").textContent = `${config.modelName}`;
}

fetchConfig();

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

function formatMessage(msg) {
    msg = msg.replace(/\n/g, "<br>"); // Replace newline characters with <br> tags
    msg = msg.replace(/\t/g, "    "); // Replace tab characters with four space characters
    return msg;
}

socket.on("bot message", (msg) => {
    msg = formatMessage(msg); // Format the message
    botMessageDiv.innerHTML += msg; // Append the formatted message to the current bot message div
    const messagesDiv = document.getElementById("messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
});

export function handleSendButtonClick() {
    sendMessage();
}
