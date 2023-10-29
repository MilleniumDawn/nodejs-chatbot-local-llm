export const config = {
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:1234/v1",
    port: process.env.PORT || 3002,
    MAX_TOKENS: process.env.MAX_TOKENS || 4096,
};
