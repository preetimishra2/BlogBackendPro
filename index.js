const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const cookieParser = require('cookie-parser')
const app = express()
const authRoute = require('./routes/auth')
const userRoute = require('./routes/users')
const postRoute = require('./routes/posts')
const commentRoute = require('./routes/comments')


//setup for cors
app.use(cors())
const corsOptions = {
    origin: '*',
    credential: true
};

app.use(cors(corsOptions));




//database
const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("database is conected sucsessfully!")

    }
    catch(err) {
        console.log("erro in database" + err)
    }
}

//middleware
dotenv.config()
app.use(express.json())
app.use("/images", express.static(path.join(__dirname,"/images")))

app.use(cookieParser())
app.use("/api/auth", authRoute)
app.use("/api/users", userRoute)
app.use("/api/posts", postRoute)
app.use("/api/comments", commentRoute)

// image upload
const storage = multer.diskStorage({
    destination:(req,file,fn) => {
        fn(null, "images")
    },
    filename:(req,file,fn) => {
        fn(null,req.body.img)
    }
})

const upload = multer({storage: storage})

app.post("/api/upload", upload.single("file"), (req,res) => {
    res.status(200).json("Image is been uploaded!")
})



app.listen(process.env.PORT, () => {

connectDB()
    console.log("app is running on port " + process.env.PORT)
})


//! models

//* users
//username 
// password
// email 
// bio 
// timestamps

//* post
//title
//desc
//photo
//username
//userid
//categories
// timestamps

//* comments
//comment
//author
//postID
//userID
//timestamp

//! routes
// auth -->signup --> login 
// users --> data 
// posts --> blog data
// comments --> user blog data and the comment data