const  mongoose = require('mongoose');
//* comments
//comment
//author
//postID
//userID
//timestamp


const CommentSchema= new mongoose.Schema({
    comment: {
    type: String,
    required: true,
   },
   author: {
    type: String,
    required: true,
   },
   postId: {
    type: String,
    required: true,
   },
   userId: {
    type: String,
    required: true,
   },
  
}, {timestamps: true})

module.exports = mongoose.model("Comment", CommentSchema)