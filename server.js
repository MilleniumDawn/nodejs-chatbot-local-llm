//server.js
// reference https://platform.openai.com/docs/api-reference/chat
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import colors from 'colors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    res.sendFile(__dirname + '/index.html');
});

// Store message history per user
const userMessageHistories = new Map();

// Function to ensure the total token count is within the limit
const ensureTokenLimit = (messageHistory) => {
    const tokenLimit = 3072;
    let tokenCount = messageHistory.reduce((count, message) => count + message.content.split(' ').length, 0);
    
    while (tokenCount > tokenLimit && messageHistory.length > 1) {
        const removedMessage = messageHistory.shift();  // Remove the earliest message
        tokenCount -= removedMessage.content.split(' ').length;  // Update the token count
    }
};

io.on('connection', (socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);

    // Initialize New User Message History
    userMessageHistories.set(socket.id, [
        {
            role: "system",
            content: "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions."
        }
    ]);

    socket.on('user message', async (msg) => {
        console.log('message: ' + msg);
        let isFirstChunk = true;
        let accumulatedResponse = '';

        // Update message history with the new user message
        const messageHistory = userMessageHistories.get(socket.id);
        messageHistory.push({
            role: "user",
            content: `USER: ${msg} ASSISTANT:`
        });

        // Ensure the message history is within the token limit
        ensureTokenLimit(messageHistory);

        try {
            const axiosInstance = axios.create({
                baseURL: "http://127.0.0.1:5001/v1",
                headers: { "Content-Type": "application/json" },
                responseType: "stream",
            });

            const response = await axiosInstance.post("/chat/completions", {
                messages: messageHistory,
                stop: ["</s>"],
                temperature: 0.7,
                max_tokens: -1,
                stream: true,
            });

            const stream = response.data;

            stream.on("data", (chunk) => {
                const lines = chunk
                    .toString()
                    .split("\n")
                    .filter((line) => line.trim() !== "");
                for (const line of lines) {
                    const message = line.replace(/^data: /, "");
                    if (message.includes("[DONE]")) return;
                    try {
                        const parsed = JSON.parse(message);
                        const chunk = parsed.choices[0].delta?.content;
                        if (chunk) {
                            accumulatedResponse += chunk;  // Accumulate chunks for message history

                            if (isFirstChunk) {
                                socket.emit('bot message', 'Bot: ' + chunk);
                                isFirstChunk = false;
                            } else {
                                socket.emit('bot message', chunk);
                            }
                        }
                    } catch (error) {
                        console.error("Could not JSON parse stream message", message, error);
                    }
                }
            });

            stream.on("end", () => {
                console.log('Stream done');
                // Update message history with the accumulated bot message
                messageHistory.push({
                    role: "assistant",
                    content: accumulatedResponse
                });
            });

            stream.on("error", (err) => {
                console.error(colors.red(err));
            });
        } catch (error) {
            console.error(colors.red(error));
        }
    });

    socket.on('disconnect', () => {
        // Optionally, clean up user message history on disconnect
        console.log(`User disconnected with socket ID: ${socket.id}`);
        userMessageHistories.delete(socket.id);
    });
});

server.listen(3002, () => {
    console.log('listening on *:3002');
});
