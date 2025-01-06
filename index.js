const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Post = require("./models/Post"); // Ensure the Post model is imported

// Import Routes
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const commentRoute = require("./routes/comments");

// Initialize App
const app = express();
dotenv.config();

// Set trust proxy to 1 to handle X-Forwarded-For header in production environments
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet()); // Add security headers
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Log requests in development
}

// Ensure `images` folder exists
const imagesFolder = "images";
if (!fs.existsSync(imagesFolder)) {
  fs.mkdirSync(imagesFolder);
}
app.use(
  "/images",
  cors(corsOptions), // Apply CORS
  express.static(path.join(__dirname, imagesFolder))
);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use("/api", apiLimiter); // Apply rate limiting to all API routes

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",  // Frontend on localhost
  "https://blogprofrontend.onrender.com",  // Your deployed frontend URL
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);  // Allow request
    } else {
      callback(new Error("Not allowed by CORS"));  // Deny request
    }
  },
  credentials: true,  // Allow cookies to be sent and received
};

// Apply CORS to API routes
app.use("/api", cors(corsOptions));

// Apply CORS to `/images` route as well (for image serving)
app.use("/images", cors(corsOptions));  // Allow images from allowed origins

// Connect to MongoDB
const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log("Database connected successfully!");
      break;
    } catch (err) {
      console.error("Error connecting to the database:", err);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after 5 seconds
    }
  }
};

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);

// Image Upload (File Validation)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  const validImageTypes = /jpeg|jpg|png|gif/;
  if (!validImageTypes.test(path.extname(file.originalname).toLowerCase())) {
    return cb(new Error("Invalid file type. Only JPG, JPEG, PNG, GIF are allowed."), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json("No file uploaded.");
    }
    res.status(200).json(req.file.filename);
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
