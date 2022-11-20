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
 * @apiSuccess (comments) {json} Comments Tab of all comments
 * @apiSuccessExample {json} Success response :
 * [
    {
        "_id": "637a4f5ff988815d9f347916",
        "content": "TEST 2",
        "date": "2022-11-20T16:01:35.588Z",
        "conversation": {
            "_id": "63777bf8ec157793f6cb0a12",
            "name": "Conversation de l'activité 63777bf8ec157793f6cb0a0f",
            "users": [
                "6377514f6c436fedc645d019",
                "637a4683ddc8dc86fcd6b889"
            ],
            "activity": "63777bf8ec157793f6cb0a0f",
            "__v": 3
        },
        "creator": {
            "email": "lucas.cuennet@gmail.com",
            "firstname": "Lucas",
            "lastname": "Cuennet",
            "role": "user",
            "registrationDate": "2022-11-20T15:34:49.915Z",
            "id": "637a4919ddc8dc86fcd6b8aa"
        },
        "__v": 0
    }
]
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
 * @apiBody {String} content
 * @apiExample Get comment 63777bf8ec157793f6cb0a12 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * GET https://sport-2-meet.onrender.com/comments/conversations=63777bf8ec157793f6cb0a12
 * @apiSuccess (comments) {json} Comment Detail of comment
 * @apiSuccessExample {json} Success response :
 * {
    "content": "test commentaire",
    "_id": "637a4ff9f988815d9f34791b",
    "date": "2022-11-20T16:04:09.845Z",
    "conversation": "63777bf8ec157793f6cb0a12",
    "creator": "637a4683ddc8dc86fcd6b889",
    "__v": 0
* }
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
 * @apiExample Delete comment 637a4ff9f988815d9f34791b :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * DELETE https://sport-2-meet.onrender.com/comments/id/637a4ff9f988815d9f34791b
 * @apiSuccess (comments) {html} Message Success message
 * @apiSuccessExample {html} Success response :
 * Commentaire supprimé
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
 * @api {patch} /comments/id/:id Modify comment by id
 * @apiGroup comments
 * @apiName ModifyCommentsById
 * @apiParam (comments) id If of comment
 * @apiBody {String} content content of the comment
 * @apiExample Patch comment 637a4ff9f988815d9f34791b :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * PATCH https://sport-2-meet.onrender.com/comments/id/637a4ff9f988815d9f34791b
 * {
 *  "content" : "test modification"
 * }
 * @apiSuccess {html} Message Success message
 * @apiSuccessExample {html} Success response:
 * Commentaire modifié
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