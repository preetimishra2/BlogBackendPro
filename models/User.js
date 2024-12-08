const  mongoose = require('mongoose');

//* users
//username 
// password
// email 
// bio 
// timestamps

const UsersSchema= new mongoose.Schema({
   username: {
    type: String,
    required: true,
    unique: true
   },
   email: {
    type: String,
    required: true,
    unique: true
   },
   password: {
    type: String,
    required: true,
   },
   bio: {
    type: String,
   }
}, {timestamps: true})

module.exports = mongoose.model("User", UsersSchema)