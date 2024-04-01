export const config = {
    modelName: "starling-beta:latest", // Replace with your desired model name
    port: process.env.PORT || 3000,
    MAX_TOKENS: process.env.MAX_TOKENS || 4096,
    HOST: process.env.HOST
};