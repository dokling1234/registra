const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
{
	action: { type: String, required: true },
	actorId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
	actorName: { type: String, default: null },
	actorType: { type: String, enum: ["admin", "superadmin", "system"], default: "system" },
	targetType: { type: String, default: null },
	targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
	metadata: { type: Object, default: {} },
	ip: { type: String, default: null },
	method: { type: String, default: null },
	path: { type: String, default: null },
	statusCode: { type: Number, default: null },
	userAgent: { type: String, default: null },
},
{ timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema); 