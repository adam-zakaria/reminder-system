const deviceService = require('../services/deviceService');

exports.getDeviceMappings = async (req, res) => {
    try {
        const mappings = await deviceService.getDeviceMappings(req.user.id);
        res.status(200).json(mappings);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching device mappings' });
    }
};

exports.addDeviceMapping = async (req, res) => {
    try {
        const mapping = await deviceService.addMapping(req.body.userId, req.body.targetClientId);
        res.status(201).json(mapping);
    } catch (error) {
        res.status(500).json({ error: 'Error adding device mapping' });
    }
};

exports.getLightCategories = async (req, res) => {
    try {
        const categories = await deviceService.getLightCategories();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching light categories' });
    }
};
