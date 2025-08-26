const ActivityLog = require("../models/activityLogModel.js");

const listLogs = async (req, res) => {
	try {
		const { action, actorType, actorId, targetType, limit = 20, skip = 0 } = req.query;
		const query = {};
		if (action) query.action = action;
		if (actorType) query.actorType = actorType;
		if (actorId) query.actorId = actorId;
		if (targetType) query.targetType = targetType;

		// Admins can only see their own logs, superadmins can see all
		if (req.user?.userType === "admin") {
			query.actorId = req.user.userId;
		}

		const logs = await ActivityLog.find(query)
			.sort({ createdAt: -1 })
			.skip(parseInt(skip))
			.limit(parseInt(limit));
		const total = await ActivityLog.countDocuments(query);
		res.json({ success: true, total, logs });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = { listLogs }; 