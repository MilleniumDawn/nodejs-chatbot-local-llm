//server.js
import express from 'express';
import { Ollama } from 'ollama';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { handleUserMessage } from './chatHandler.js';
import { UserHistoryManager } from './userHistoryManager.js';
import { errorHandlingMiddleware } from './errorHandlingMiddleware.js';
import { config } from './config.js';

const app = express();
const server = createServer(app);
const io = new Server(server);
const userHistoryManager = new UserHistoryManager();
const ollama = new Ollama({ host: config.HOST });

app.use(express.static('public'));
app.use(errorHandlingMiddleware);

app.get('/', (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    res.sendFile(__dirname + '/index.html');
});
app.get('/config', (req, res) => {
    res.json({ modelName: config.modelName });
});

async function sendIntroductoryMessage(socket) {
    try {
        const response = await ollama.chat({
            model: config.modelName,
            messages: [
                { role: "system", content: "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions." },
                {
                    role: "user",
                    content: `USER : Tell me what you are in one phrase. ASSISTANT: `
                }
            ],
            stream: false,
        });

        const introductionMessage = response.message.content;
        socket.emit("bot introductory message", introductionMessage);
    } catch (error) {
        console.error("Error while fetching introductory message:", error);
    }
}


io.on('connection', (socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);
    sendIntroductoryMessage(socket);

    // Initialize New User Message History
    userHistoryManager.setUserMessageHistory(socket.id, [
        {
            role: "system",
            content: "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions."
        }
    ]);

    socket.on('user message', async (msg) => {
        console.log('message: ' + msg);
        const messageHistory = userHistoryManager.getUserMessageHistory(socket.id);
        messageHistory.push({
            role: "user",
            content: `USER: ${msg} ASSISTANT:`
        });

        await handleUserMessage(socket, messageHistory, msg);
    });

    socket.on('disconnect', () => {
        // Optionally, clean up user message history on disconnect
        console.log(`User disconnected with socket ID: ${socket.id}`);
        userHistoryManager.deleteUserMessageHistory(socket.id);
    });
});

server.listen(config.port, () => {
    console.log(`listening on localhost:${config.port}`);
});
