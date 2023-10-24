// open-ai.js
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    // apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
    basePath: "http://localhost:1234/v1", // Set the base path to your local API
    base_path: "http://localhost:1234/v1",
});

export default openai;
