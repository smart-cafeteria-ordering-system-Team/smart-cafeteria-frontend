const mongoose = require("mongoose");

/**
 * ActivityLog Schema - Audit trail of admin/system activity.
 *
 * Frontend Usage:
 * - admin dashboard / activity views: show audit trail.
 */
const ActivityLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: {
      type: String,
      default: "System",
    },
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      default: "",
    },
    entityId: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
