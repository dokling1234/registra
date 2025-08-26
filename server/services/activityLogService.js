const ActivityLog = require("../models/activityLogModel.js");

const resolveActor = (req) => {
	if (req && req.user) {
		return {
			actorId: req.user.userId || null,
			actorName: req.user.fullName || null,
			actorType: req.user.userType || "system",
		};
	}
	return { actorId: null, actorName: null, actorType: "system" };
};

const logActivity = async (req, details) => {
	try {
		const { actorId, actorName, actorType } = resolveActor(req);
		const log = new ActivityLog({
			action: details.action,
			actorId,
			actorName,
			actorType,
			targetType: details.targetType || null,
			targetId: details.targetId || null,
			metadata: details.metadata || {},
			ip: (req.headers && (req.headers["x-forwarded-for"] || req.connection?.remoteAddress)) || null,
			method: req.method,
			path: req.originalUrl || req.url,
			statusCode: details.statusCode || null,
			userAgent: req.headers?.["user-agent"] || null,
		});
		await log.save();
	} catch (err) {
		// Avoid throwing to not break primary flow
		console.error("Activity log error:", err.message);
	}
};

module.exports = { logActivity }; 