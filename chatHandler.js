//chatHandler.js
import ollama from 'ollama';
import { config } from "./config.js";
import { UserHistoryManager } from "./userHistoryManager.js";

const userHistoryManager = new UserHistoryManager();

export async function handleUserMessage(socket, messageHistory, msg) {
    let isFirstChunk = true;
    let accumulatedResponse = "";

    userHistoryManager.setUserMessageHistory(socket.id, messageHistory);
    userHistoryManager.ensureTokenLimit(socket.id);

    try {
        const response = await ollama.chat({
            model: config.modelName,
            messages: messageHistory,
            stream: true,
        });

        for await (const part of response) {
            const chunk = part.message.content;
            accumulatedResponse += chunk;

            if (isFirstChunk) {
                socket.emit("bot message", "Bot: " + chunk);
                isFirstChunk = false;
            } else {
                socket.emit("bot message", chunk);
            }
        }

        messageHistory.push({
            role: "assistant",
            content: accumulatedResponse,
        });
    } catch (error) {
        console.error(error);
        socket.emit("error message", "An error occurred while processing your request.");
    }
}
