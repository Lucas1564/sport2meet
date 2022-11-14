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
router.post('/activities=:id', authenticate, function (req, res, next) {
  // Create a new document from the JSON in the request body
  const newComment = new Comment(req.body);
  newComment.activity = req.params.id;
  newComment.user = req.user._id;
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
router.delete('/id/:id', authenticate, function (req, res) {
  Comment.findByid(req.params.id).exec(function (err, commentById) {
    if (err) {
      return next(err);
    }
    if (commentById.user == req.user._id || req.user.role == "admin") {
      Comment.findByIdAndDelete(req.params.id, function (err, commentById) {
        if (err) {
          return next(err);
        }
        // Supprimer avec succès
        res.send("Commentaire supprimé");
      });
    } else {
      res.status(401).send("Vous n'avez pas les droits pour supprimer ce commentaire");
    }
  });
});

/* PATCH comment */
router.patch('/id/:id', authenticate, function (req, res) {
  //if creator = req.id or role = admin, update comment
  Comment.findByid(req.params.id).exec(function (err, commentById) {
    if (err) {
      return next(err);
    }
    if (commentById.user == req.user._id || req.user.role == "admin") {
      Comment.findByIdAndUpdate(req.params.id, req.body, function (err, commentById) {
        if (err) {
          return next(err);
        }
        // Update avec succès
        res.send("Commentaire modifié");
      });
    } else {
      res.status(401).send("Vous n'avez pas les droits pour modifier ce commentaire");
    }
  });
});

export default router;