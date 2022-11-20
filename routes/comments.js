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

/**
 * @api {get} /comments Get all comment
 * @apiGroup comments
 * @apiName GetAllComments
 * @apiExample Get comments :
 * GET https://sport-2-meet.onrender.com/comments
 * @apiSuccess (comments) {json} Comments XXX
 * @apiSuccessExample {json} Get comments :
 * 
 */
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

/**
 * @api {post} /comments/conversation=:id Create a comment
 * @apiGroup comments
 * @apiName GetCommentsById
 * @apiParam (comments) id If of XXXXX
 * @apiBody {String} content
 * @apiExample Get comment 6146554866 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * GET https://sport-2-meet.onrender.com/comments/conversations=6146554866
 * @apiSuccess (comments) {json} Comment XXX
 * @apiSuccessExample {json} Get comment 6146554866:
 * 
 * @apiErrorExample {html} False conversation id : 
 */
/* POST new comment */
router.post('comments/conversation=:id', authenticate, function (req, res, next) {
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
      // For each user in the conversation, send a message to the websocket
      conversationById.users.forEach(user => {
        if (user.toString() != req.user._id.toString()) {
          // Send a message to specific user with CODE NEW_MESSAGE
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

/**
 * @api {delete} /comments/conversation=:id Delete comment by id
 * @apiGroup comments
 * @apiName DeleteCommentsById
 * @apiParam (comments) id If of comment
 * @apiExample Delete comment 6146554866 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * DELETE https://sport-2-meet.onrender.com/comments/id/6146554866
 * @apiSuccess (comments) {} XXX
 * @apiSuccessExample {XXX} Delete comment 6146554866:
 * 
 * @apiErrorExample {html} False id of comment :
 */
/* DELETE comment by id */
router.delete('/id/:id', authenticate, function (req, res) {
  Comment.findByid(req.params.id).exec(function (err, commentById) {
    if (err) {
      return next(err);
    }
    // Check if the user is the creator of the comment or an admin
    if (commentById.user == req.user._id || req.user.role == "admin") {
      Comment.findByIdAndDelete(req.params.id, function (err, commentById) {
        if (err) {
          return next(err);
        }
        Conversation.findById(commentById.conversation, function (err, conversationById) {
          if (err) {
            return next(err);
          }
          // For each user in the conversation, send a message to the websocket
          conversationById.users.forEach(user => {
            if (user.toString() != req.user._id.toString()) {
              // Send a message to specific user with CODE DELETE_MESSAGE
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

/**
 * @api {patch} /comments/id/:id Patch comment by id
 * @apiGroup comments
 * @apiName PatchCommentsById
 * @apiParam (comments) id If of comment
 * @apiBody {String} content
 * @apiExample Patch comment 6146554866 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * PATCH https://sport-2-meet.onrender.com/comments/id/6146554866
 * 
 * @apiSuccessExample {json} Patch comment 6146554866:
 * 
 * @apiErrorExample {html} False id of comment :
 */
/* PATCH comment */
router.patch('/id/:id', authenticate, function (req, res) {
  Comment.findByid(req.params.id).exec(function (err, commentById) {
    if (err) {
      return next(err);
    }
    // Check if the user is the creator of the comment or an admin
    if (commentById.user == req.user._id || req.user.role == "admin") {
      Comment.findByIdAndUpdate(req.params.id, req.body, function (err, commentById) {
        if (err) {
          return next(err);
        }
        Conversation.findById(commentById.conversation, function (err, conversationById) {
          if (err) {
            return next(err);
          }
          // For each user in the conversation, send a message to the websocket
          conversationById.users.forEach(user => {
            if (user.toString() != req.user._id.toString()) {
              // Send a message to specific user with CODE UPDATE_MESSAGE
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