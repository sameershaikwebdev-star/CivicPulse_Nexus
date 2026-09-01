const Complaint = require("../models/Complaint");

// POST /api/complaints
async function createComplaint(req, res) {
  try {
    const {
      title,
      category,
      priority,
      location,
      latitude,
      longitude,
      description,
    } = req.body;

    if (!title || !category || !priority || !location || !description) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const photos = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const complaint = await Complaint.create({
      title,
      category,
      priority,
      location,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      description,
      photos,
      submittedBy: req.user._id,
    });

    res.status(201).json({ complaint });

  } catch (err) {
    console.error("Create complaint error:", err);

    res.status(500).json({
      message: "Failed to create complaint",
      error: err.message,
    });
  }
}

// GET /api/complaints  (all complaints - supports ?mine=true, ?status=, ?category=)
async function getComplaints(req, res) {
  try {
    const filter = {};

    if (req.query.mine === "true") {
      filter.submittedBy = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const complaints = await Complaint.find(filter)
      .populate("submittedBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch complaints", error: err.message });
  }
}

// GET /api/complaints/:id
async function getComplaintById(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "submittedBy",
      "fullName email role"
    );
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch complaint", error: err.message });
  }
}

// PATCH /api/complaints/:id/status (officers/staff/admin update status)
async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "In Progress", "Resolved", "Rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("submittedBy", "fullName email role");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
}

// DELETE /api/complaints/:id (owner or admin/staff)
async function deleteComplaint(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const isOwner = complaint.submittedBy && complaint.submittedBy.toString() === req.user._id.toString();
    const isAdminOrStaff = ["Admin", "Government Officer", "Department Staff"].includes(req.user.role);

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({ message: "Not authorized to delete this complaint" });
    }

    await complaint.deleteOne();
    res.json({ message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete complaint", error: err.message });
  }
}

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  deleteComplaint,
};
