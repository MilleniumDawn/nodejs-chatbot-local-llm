// Import the necessary modules
import axios from "axios";
import readlineSync from "readline-sync";
import colors from "colors";
import http from "http";

async function main() {
    console.log(colors.bold.green("Welcome to the Chatbot Program!"));
    console.log(colors.bold.green("You can start chatting with the bot."));

    while (true) {
        const userInput = readlineSync.question(colors.yellow("You: "));
        let isFirstChunk = true;  // Add this line

        await new Promise(async (resolve, reject) => {
            try {
                const messages = [{ role: "user", content: userInput }];

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
                                if (isFirstChunk) {  // Add this block
                                    process.stdout.write(colors.green("Bot: " + chunk));
                                    isFirstChunk = false;
                                } else {
                                    process.stdout.write(colors.green(chunk));
                                }
                            }
                        } catch (error) {
                            console.error("Could not JSON parse stream message", message, error);
                        }
                    }
                });

                stream.on("end", () => {
                    console.log("");
                    resolve();
                });

                stream.on("error", (err) => {
                    console.error(colors.red(err));
                    reject(err);
                });
            } catch (error) {
                console.error(colors.red(error));
                reject(error);
            }
        });
    }
}

main();
