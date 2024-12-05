const reminderService = require('../services/reminderService');

exports.createReminder = async (req, res) => {
    try {
        const reminder = await reminderService.create(req.user, req.body);
        res.status(201).json(reminder);
    } catch (error) {
        res.status(500).json({ error: 'Error creating reminder' });
    }
};

exports.getReminders = async (req, res) => {
    try {
        const reminders = await reminderService.getUserReminders(req.user.id);
        res.status(200).json(reminders);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reminders' });
    }
};

exports.getReminderById = async (req, res) => {
    try {
        const reminder = await reminderService.getReminderById(req.params.id, req.user.id);
        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.status(200).json(reminder);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reminder' });
    }
};

exports.updateReminder = async (req, res) => {
    try {
        const updatedReminder = await reminderService.updateReminder(req.params.id, req.body);
        if (!updatedReminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.status(200).json(updatedReminder);
    } catch (error) {
        res.status(500).json({ error: 'Error updating reminder' });
    }
};

exports.deleteReminder = async (req, res) => {
    try {
        const deleted = await reminderService.deleteReminder(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.status(200).json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting reminder' });
    }
};
