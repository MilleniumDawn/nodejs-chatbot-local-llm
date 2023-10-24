// Import the necessary modules
import axios from "axios";
import readlineSync from "readline-sync";
import colors from "colors";
import http from "http";

async function main() {
    console.log(colors.bold.green("Welcome to the Chatbot Program!"));
    console.log(colors.bold.green("You can start chatting with the bot."));

    const chatHistory = []; // Store conversation history

    while (true) {
        const userInput = readlineSync.question(colors.yellow("You: "));

        try {
            // Construct messages by iterating over the history
            const messages = chatHistory.map(([role, content]) => ({
                role,
                content,
            }));

            // Add latest user input
            messages.push({ role: "user", content: userInput });

            // Create an axios instance for streaming
            const axiosInstance = axios.create({
                baseURL: "http://localhost:1234/v1",
                headers: { "Content-Type": "application/json" },
                responseType: 'stream'
            });

            // Call the API with user input & history
            const response = await axiosInstance.post(
                "/chat/completions",
                {
                    messages: messages,
                    stop: ["### Instruction:"],
                    temperature: 0.7,
                    max_tokens: -1,
                    stream: true,
                }
            );

            // The response data should now be a readable stream
            const stream = response.data;
            
            stream.on('data', (chunk) => {
                const payloads = chunk.toString().split("\n\n");
                for (const payload of payloads) {
                    if (payload.includes('[DONE]')) return;
                    if (payload.startsWith("data:")) {
                        const data = JSON.parse(payload.replace("data: ", ""));
                        try {
                            const chunk = data.choices[0].delta?.content;
                            if (chunk) {
                                console.log(colors.green("Bot: ") + chunk);
                                
                                // Update history with assistant response
                                chatHistory.push(["assistant", chunk]);
                            }
                        } catch (error) {
                            console.log(`Error with JSON.parse and ${payload}.\n${error}`);
                        }
                    }
                }
            });

            stream.on('end', () => {
                setTimeout(() => {
                    console.log('\nStream done');
                }, 10);
            });

            stream.on('error', (err) => {
                console.error(colors.red(err));
            });

        } catch (error) {
            console.error(colors.red(error));
        }
    }
}

main();
