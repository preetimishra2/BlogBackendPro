const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const cookieParser = require("cookie-parser");
const Post = require("./models/Post"); // Ensure the Post model is imported

// Import Routes
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const commentRoute = require("./routes/comments");

// Initialize App
const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use("/images", express.static(path.join(__dirname, "/images")));

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000", 
  "https://your-production-domain.com",
  "https://your-staging-domain.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      // No need for useNewUrlParser or useUnifiedTopology
    });
    console.log("Database is connected successfully!");
  } catch (err) {
    console.error("Error in database connection: ", err);
  }
};


// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);

// Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json("No file uploaded.");
    }
    res.status(200).json(req.file.filename);
    console.log(req.body); // Log request body
    console.log(req.file); // Log file details
  } catch (err) {
    res.status(500).json("Error uploading file.");
  }
});

// Update Post
app.put("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post not found.");
    }

    // Update provided fields
    const updatedData = {
      ...req.body,
      photo: req.body.photo || post.photo, // Retain old photo if none provided
    };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json("An error occurred while updating the post.");
  }
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  connectDB();
  console.log(`App is running on port ${PORT}`);
});

//! Models

//* users
// username
// password
// email
// bio
// timestamps

//* post
// title
// desc
// photo
// username
// userid
// categories
// timestamps

//* comments
// comment
// author
// postID
// userID
// timestamp

//! Routes
// auth --> signup --> login
// users --> data
// posts --> blog data
// comments --> user blog data and the comment data
