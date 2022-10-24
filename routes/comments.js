import express from "express";
import Comment from "../models/comment.js"


const router = express.Router();

/* GET comments listing. */
router.get('/', function (req, res, next) {
    Comment.find().sort('content').exec(function (err, comments) {
        if (err) {
            return next(err);
        }
        res.send(comments);
    });
});

/* POST new comment */
router.post('/', function (req, res, next) {
    // Create a new document from the JSON in the request body
    const newComment = new Comment(req.body);
    // Save that document
    newComment.save(function (err, savedComment) {
      if (err) {
        return next(err);
      }
      // Send the saved document in the response
      res.send(savedComment);
    });
  });

export default router;