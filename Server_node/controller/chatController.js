const chatService = require('../services/chatService');

exports.sendMessage = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const response = await chatService.processChatMessage(req.user, message, sessionId);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: 'Error processing chat message' });
    }
};

exports.getChatThread = async (req, res) => {
    try {
        const thread = await chatService.getChatThread(req.params.threadId);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        res.status(200).json(thread);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching chat thread' });
    }
};
