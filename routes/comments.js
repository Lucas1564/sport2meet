import express from "express";
import Comment from "../models/comment.js"
import {
  authenticate
} from "./auth.js";


const router = express.Router();

/* GET comments listing. */
router.get('/', authenticate, function (req, res, next) {
  Comment.find().sort('content').exec(function (err, comments) {
    if (err) {
      return next(err);
    }
    res.send(comments);
  });
});

/* POST new comment */
router.post('/', authenticate, function (req, res, next) {
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

/* DELETE comment by id */
router.delete('/id/:id', authenticate, function(req,res){
  Comment.deleteOne({
    _id: req.params.id,
  }, function (err, user) {
    if (err)
      return console.error(err);

    console.log('Comment successfully removed !');
    res.send("Commmentaire supprimé avec succès")
    res.status(200).send();
  });
});

/* PATCH comment */
// router.patch('/id/:id', authenticate, function (req, res, next) {
  
//   // patch only if req.user._id == req.params.id
//   if (req.user._id == req.params.id || req.user.role == "admin") {
//     // patch by req.params.body
//     var commentModif = req.body;


//     Comment.findByIdAndUpdate(req.params.id, commentModif, function (err, userById) {
//       if (err) {
//         return next(err);
//       }
//       res.send("Commentaire modifié avec succès");
//     });
//   } else {
//     res.send("Vous n'avez pas les droits pour modifier ce commentaire");
//   }
// });

export default router;

