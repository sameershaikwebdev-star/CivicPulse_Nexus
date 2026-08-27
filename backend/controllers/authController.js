const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { fullName, email, phone, address, role, password, confirmPassword } =
      req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      fullName,
      email,
      phone,
      address,
      role,
      password,
    });

    const token = signToken(user._id);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Username/Email and password required" });
    }

    const queryInput = email.trim();
    const lowerQuery = queryInput.toLowerCase();

    // Special handling for Super Admin: sameerShaik / Sameer@123
    if (
      (lowerQuery === "sameershaik" || lowerQuery === "sameershaik@infosys.com") &&
      password === "Sameer@123"
    ) {
      let adminUser = await User.findOne({
        $or: [{ email: "sameershaik@infosys.com" }, { fullName: "sameerShaik" }],
      });

      if (!adminUser) {
        adminUser = await User.create({
          fullName: "sameerShaik",
          email: "sameershaik@infosys.com",
          phone: "+91 9876543210",
          address: "Infosys Smart Governance Campus",
          role: "Admin",
          password: "Sameer@123",
        });
      }

      const token = signToken(adminUser._id);
      return res.json({ user: adminUser, token });
    }

    let user = await User.findOne({
      $or: [
        { email: lowerQuery },
        { fullName: new RegExp(`^${queryInput}$`, "i") },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username/email or password" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid username/email or password" });
    }

    const token = signToken(user._id);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
