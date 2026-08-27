const express = require("express");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  deleteComplaint,
} = require("../controllers/complaintController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/", protect, upload.array("photos", 5), createComplaint);
router.get("/", protect, getComplaints);
router.get("/:id", protect, getComplaintById);
router.patch("/:id/status", protect, updateStatus);
router.delete("/:id", protect, deleteComplaint);

module.exports = router;
