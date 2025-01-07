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

app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "https:", "data:"], // Allow image loading from any secure source
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading
  })
);


// Enable morgan logging in development mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Ensure `images` folder exists
const imagesFolder = "images";
if (!fs.existsSync(imagesFolder)) {
  fs.mkdirSync(imagesFolder);
}

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
});
app.use("/api", apiLimiter);

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://blogprofrontend.onrender.com",
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

// Apply CORS
app.use(cors(corsOptions));

// Serve Static Files from `/images`
app.use(
  "/images",
  express.static(path.join(__dirname, "images"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// MongoDB Connection
const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Database connected successfully!");
      break;
    } catch (err) {
      console.error("Error connecting to the database:", err.message);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);

// File Upload Configuration
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
  const validImageTypes = /jpeg|jpg|png|gif/;
  if (!validImageTypes.test(path.extname(file.originalname).toLowerCase())) {
    return cb(new Error("Invalid file type. Only JPG, JPEG, PNG, GIF are allowed."), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Upload Endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json("No file uploaded.");
    }
    res.status(200).json(req.file.filename);
  } catch (err) {
    console.error("Error during file upload:", err);
    res.status(500).json("Error uploading file.");
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }
  if (err) {
    return res.status(500).json({ error: "An internal server error occurred." });
  }
  next();
});

// Update Post Endpoint
app.put("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post not found.");
    }

    const updatedData = {
      ...req.body,
      photo: req.body.photo || post.photo,
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
(async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
    } catch (err) {
        console.error("Failed to connect to the database. Exiting...");
        process.exit(1);
    }
})();