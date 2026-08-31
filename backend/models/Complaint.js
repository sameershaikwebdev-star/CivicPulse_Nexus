const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Roads",
        "Water Supply",
        "Electricity",
        "Garbage",
        "Drainage",
        "Street Lights",
        "Public Transport",
        "Other",
      ],
    },
    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Emergency"],
    },
    location: { type: String, required: true, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    description: { type: String, required: true, trim: true },
    photos: [{ type: String }], // stored file paths / URLs
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
