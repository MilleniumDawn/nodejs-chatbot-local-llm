import axios from "axios";
import { config } from "./config.js";
import { UserHistoryManager } from "./userHistoryManager.js";

const userHistoryManager = new UserHistoryManager();

export async function handleUserMessage(socket, messageHistory, msg) {
    let isFirstChunk = true;
    let accumulatedResponse = "";

    // Ensure the message history is within the token limit
    userHistoryManager.ensureTokenLimit(socket.id);

    try {
        const axiosInstance = axios.create({
            baseURL: config.apiBaseUrl,
            headers: { "Content-Type": "application/json" },
            responseType: "stream",
        });

        const response = await axiosInstance.post(
            `${config.apiBaseUrl}${config.API_ENDPOINT}`, 
            {
                messages: messageHistory,
                stop: config.STOP_SEQUENCE,
                temperature: config.TEMPERATURE,
                max_tokens: config.MAX_TOKENS,
                stream: config.STREAM,
                repetition_penalty: config.REPETITION_PENALTY,
                top_p: config.TOP_P,
                top_k: config.TOP_K,
                frequency_penalty: config.FREQUENCY_PENALTY,
                presence_penalty: config.PRESENCE_PENALTY,
            }
        );

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
                        accumulatedResponse += chunk; // Accumulate chunks for message history

                        if (isFirstChunk) {
                            socket.emit("bot message", "Bot: " + chunk);
                            isFirstChunk = false;
                        } else {
                            socket.emit("bot message", chunk);
                        }
                    }
                } catch (error) {
                    console.error("Could not JSON parse stream message", message, error);
                }
            }
        });

        stream.on("end", () => {
            console.log("Stream done");
            // Update message history with the accumulated bot message
            messageHistory.push({
                role: "assistant",
                content: accumulatedResponse,
            });
        });

        stream.on("error", (err) => {
            console.error(err);
            socket.emit("error message", "An error occurred while processing your request.");
        });
    } catch (error) {
        console.error(error);
        socket.emit("error message", "An error occurred while processing your request.");
    }
}
