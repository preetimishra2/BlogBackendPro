const  mongoose = require('mongoose');

//* users
//username 
// password
// email 
// bio 
// timestamps

const PostSchema= new mongoose.Schema({
   title: {
    type: String,
    required: true,
    unique: true
   },
   desc: {
    type: String,
    required: true,
    unique: true
   },
   photo: {
    type: String,
    required: false,
   },
   categories: {
    type: Array,
   },
   username: {
    type: String,
    required: true,
   },
   userId: {
    type: String,
    required: true,
   }
}, {timestamps: true})

module.exports = mongoose.model("Post", PostSchema)