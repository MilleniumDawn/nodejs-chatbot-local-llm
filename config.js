//config.js
export const config = {
    modelName: "dolphin-2.2.1-mistral-7b.Q8_0.gguf",
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:1235/v1",
    port: process.env.PORT || 3002,
    MAX_TOKENS: process.env.MAX_TOKENS || 4096,
    API_ENDPOINT: "/chat/completions",
    STOP_SEQUENCE: ["<.>"],
    TEMPERATURE: 0.7,
    STREAM: true,
    REPETITION_PENALTY: 1.1,
    TOP_P: 0.9,
    TOP_K: 20,
    FREQUENCY_PENALTY: 0.5,
    PRESENCE_PENALTY: 0.5,
};
