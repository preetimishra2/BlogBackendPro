const express = require('express')
const router = express.Router()
const verifyToken = require('../verifyToken')
const Comment = require('../models/Comment')
const Post = require('../models/Post')

//Create

router.post("/create", verifyToken, async (req, res) => {
    try {

        const newPost = new Post(req.body)

        const savedPost = await newPost.save()
        res.status(200).json(savedPost)

    }
    catch (err) {
        res.status(500).json(err)
    }

})


//update
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const updatedpost = await Post.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        res.status(200).json(updatedpost)
    }
    catch (err) {
        res.status(500).json(err)
    }
})


// delete
router.delete("/:id", verifyToken, async (req, res) => {
    try {

        await Post.findByIdAndDelete(req.params.id)
        await Comment.deleteMany({ postId: req.params.id })
        res.status(200).json("post has been deleted")

    }
    catch (err) {
        res.status(500).json(err)
    }
})

// get single post

router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
});

// all posts  + search 

router.get("/", async (req, res) => {

    const query = req.query

    try {
        const searchFilter = {
            title: { $regex: query.search, $options: "i" }
        }
        const posts = await Post.find(query.search ? searchFilter : null)
        res.status(200).json(posts)


    }
    catch (err) {
        res.status(500).json(err)
    }
})

//users post
router.get("user/userId", async(req,res) => {
    try{
        const posts = Post.find({userId: req.params.userId})
        res.status(200).json(posts)
    }
    catch(err){
        res.status(500).json(err)
    }
})
router.get("/user/:userId", async (req, res) => {
    try {
      const posts = await Post.find({ userId: req.params.userId });
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  


//! how many ways we are going to use post 
// specific post  --> get -->  /:id
// all the post --> get --> /
// user specific post  --> get -->user/userID


module.exports = router
