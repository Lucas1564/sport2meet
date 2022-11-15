import express from "express";
import Comment from "../models/comment.js"
import Conversation from "../models/conversation.js";
import {
  sendMessageToSpecificUser
} from "../ws.js";
import {
  authenticate
} from "./auth.js";


const router = express.Router();

/* GET comments listing. */
router.get('/', authenticate, function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 50;
  const skip = (page - 1) * perPage;

  //populate creator and conversation
  Comment.find().sort('content').skip(skip).limit(perPage).populate('creator').populate('conversation').exec(function (err, comments) {
    if (err) {
      return next(err);
    }
    res.send(comments);
  });
});


/* POST new comment */
router.post('/conversation=:id', authenticate, function (req, res, next) {
  Conversation.findById(req.params.id, function (err, conversationById) {
    if (err) {
      return next(err);
    }
    // Create a new document from the JSON in the request body
    const newComment = new Comment(req.body);
    newComment.conversation = req.params.id;
    newComment.creator = req.user._id;
    newComment.date = new Date();
    // Save that document
    newComment.save(function (err, savedComment) {
      if (err) {
        return next(err);
      }
      // Send the saved document in the response
      conversationById.users.forEach(user => {
        if (user.toString() != req.user._id.toString()) {
          sendMessageToSpecificUser({
            "data": {
              "message": {
                "id": savedComment._id,
                "content": savedComment.content,
              },
              "conversation": {
                "id": conversationById._id,
                "name": conversationById.name,
              },
              "sender": {
                "id": req.user._id,
                "username": req.user.firstname + " " + req.user.lastname,
              },
              "date": savedComment.date
            },
          }, user, "NEW_MESSAGE");
        }
      });
      res.send(savedComment);
    });
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
        Conversation.findById(commentById.conversation, function (err, conversationById) {
          if (err) {
            return next(err);
          }
          conversationById.users.forEach(user => {
            if (user.toString() != req.user._id.toString()) {
              sendMessageToSpecificUser({
                "data": {
                  "message": {
                    "id": commentById._id,
                    "content": commentById.content,
                  },
                  "conversation": {
                    "id": conversationById._id,
                    "name": conversationById.name,
                  },
                  "sender": {
                    "id": req.user._id,
                    "username": req.user.firstname + " " + req.user.lastname,
                  },
                  "date": commentById.date
                },
              }, user, "DELETE_MESSAGE");
            }
          });
        });
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
        Conversation.findById(commentById.conversation, function (err, conversationById) {
          if (err) {
            return next(err);
          }
          conversationById.users.forEach(user => {
            if (user.toString() != req.user._id.toString()) {
              sendMessageToSpecificUser({
                "data": {
                  "message": {
                    "id": commentById._id,
                    "content": commentById.content,
                  },
                  "conversation": {
                    "id": conversationById._id,
                    "name": conversationById.name,
                  },
                  "sender": {
                    "id": req.user._id,
                    "username": req.user.firstname + " " + req.user.lastname,
                  },
                  "date": commentById.date
                },
              }, user, "UPDATE_MESSAGE");
            }
          });
        });
        // Update avec succès
        res.send("Commentaire modifié");
      });
    } else {
      res.status(401).send("Vous n'avez pas les droits pour modifier ce commentaire");
    }
  });
});

export default router;