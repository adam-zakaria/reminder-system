const activityService = require('../services/activityService');

exports.getActivities = async (req, res) => {
    try {
        const activities = await activityService.getAllActivities();
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching activities' });
    }
};
