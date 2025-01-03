const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, email, password: hashedPassword });
    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Login
router.post("/login", async (req, res) => {
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.cookies);

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json("User not found");
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(401).json("Wrong password");
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      process.env.SECRET,
      { expiresIn: "3d" }
    );

    const { password, ...info } = user._doc;

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    }).status(200).json(info);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Logout
router.get("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    }).status(200).send("User logout success");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Refetch
router.get("/refetch", (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json("No token provided");
    }

    jwt.verify(token, process.env.SECRET, {}, async (err, data) => {
      if (err) {
        return res.status(403).json("Invalid or expired token");
      }
      res.status(200).json(data);
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
