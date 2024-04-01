// userHistoryManager.js
import { config } from './config.js';

export class UserHistoryManager {
    constructor() {
        this.userMessageHistories = new Map();
    }

    getUserMessageHistory(userId) {
        return this.userMessageHistories.get(userId);
    }

    setUserMessageHistory(userId, messageHistory) {
        this.userMessageHistories.set(userId, messageHistory);
    }

    deleteUserMessageHistory(userId) {
        this.userMessageHistories.delete(userId);
    }

    ensureTokenLimit(userId) {
        const messageHistory = this.userMessageHistories.get(userId);
        if (!messageHistory) return;  // Exit if no message history found

        const tokenLimit = config.MAX_TOKENS - 512;  // Adjusted token limit
        let tokenCount = messageHistory.reduce((count, message) => count + message.content.split(' ').length, 0);

        while (tokenCount > tokenLimit && messageHistory.length > 1) {
            const removedMessage = messageHistory.shift();  // Remove the earliest message
            tokenCount -= removedMessage.content.split(' ').length;  // Update the token count
        }

        this.userMessageHistories.set(userId, messageHistory);  // Update message history
    }
}
