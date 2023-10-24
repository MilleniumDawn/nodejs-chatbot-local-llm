// Import required libraries
import axios from 'axios';
import readlineSync from 'readline-sync';
import colors from 'colors';

// Define the main function
async function main() {
    console.log(colors.bold.green("Welcome to the Chatbot Program!"));
    console.log(colors.bold.green("You can start chatting with the bot."));

    const chatHistory = [];  // Store conversation history

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

            // Define the API request data
            const requestData = {
                messages,
                stop: ["### Instruction:"],
                temperature: 0.7,
                max_tokens: -1,
                stream: false
            };

            // Send a request to the local API
            const response = await axios.post('http://localhost:1234/v1/chat/completions', requestData, {
                headers: { 'Content-Type': 'application/json' },
            });

            // Get completion text/content
            const completionText = response.data.choices[0].message.content;

            if (userInput.toLowerCase() === "exit") {
                console.log(colors.green("Bot: ") + completionText);
                return;
            }

            console.log(colors.green("Bot: ") + completionText);

            // Update history with user input and assistant response
            chatHistory.push(["user", userInput]);
            chatHistory.push(["assistant", completionText]);
        } catch (error) {
            console.error(colors.red(error));
        }
    }
}

// Call the main function
main();
