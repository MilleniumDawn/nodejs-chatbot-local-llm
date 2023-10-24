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


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('user message', async (msg) => {
        console.log('message: ' + msg);
        let isFirstChunk = true;
        
        try {
            const messages = [{ role: "user", content: msg }];

            const axiosInstance = axios.create({
                baseURL: "http://localhost:1234/v1",
                headers: { "Content-Type": "application/json" },
                responseType: "stream",
            });

            const response = await axiosInstance.post("/chat/completions", {
                messages: messages,
                stop: ["### Instruction:"],
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
            });

            stream.on("error", (err) => {
                console.error(colors.red(err));
            });
        } catch (error) {
            console.error(colors.red(error));
        }
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
