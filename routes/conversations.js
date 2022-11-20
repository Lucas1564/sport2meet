import express from 'express';
import Conversation from '../models/conversation.js';
import {
    authenticate
} from "./auth.js";

const router = express.Router();

/**
 * @api {get} /conversations Get all conversations
 * @apiGroup conversations
 * @apiName GetAllConversations
 * @apiExample Get conversations :
 * GET https://sport-2-meet.onrender.com/conversations
 * @apiSuccessExample {json} Get conversation :
 * Status : 200 OK
 * [
    {
        "_id": "63777bf8ec157793f6cb0a12",
        "name": "Conversation de l'activité 63777bf8ec157793f6cb0a0f",
        "users": [
            "6377514f6c436fedc645d019"
        ],
        "activity": "63777bf8ec157793f6cb0a0f",
        "__v": 0
    }
]
 */
/* GET conversations listing. */
router.get('/', authenticate, function (req, res, next) {
    Conversation.find().sort('content').exec(function (err, conversations) {
        if (err) {
            return next(err);
        }
        res.send(conversations);
    });
});

/**
 * @api {post} /comments/activity=:id Post new conversation
 * @apiGroup conversations
 * @apiName CreateConversations
 * @apiBody {String} name
 * @apiBody {Array} users' id
 * @apiExample Post conversation for activity 63777bf8ec157793f6cb0a0f :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * GET https://sport-2-meet.onrender.com/conversations/activity=63777bf8ec157793f6cb0a0f
 * {
 * "name" : "conversation",
 * "users" : ["637251e3abb31189cb4cfcc1", "63725364abb31189cb4cfcc4"]
 * }
 * @apiSuccessExample {json} Get conversations for activity 63777bf8ec157793f6cb0a0f :
 * 
 * @apiErrorExample {html} False id of activity :
 * 
 */
/* POST new conversation */
router.post('/activity=:id', authenticate, function (req, res, next) {
    // Create a new document from the JSON in the request body
    const newConversation = new Conversation(req.body);
    newConversation.activity = req.params.id;
    var users = [];
    users.push(req.user._id);
    newConversation.users = users;
    newConversation.name = "Conversation de l'activité " + req.params.id;
    // Save that document
    newConversation.save(function (err, savedConversation) {
        if (err) {
            return next(err);
        }
        // Send the saved document in the response
        res.send(savedConversation);
    });
});

/**
 * @api {delete} /conversations/id/:id Delete conversation by id
 * @apiGroup conversations
 * @apiName GetConversationById
 * @apiExample Get conversation :
 * GET https://sport-2-meet.onrender.com/conversations/id/57895466
 * @apiSuccessExample {json} Get conversation 547896523415 :
 * 
 * @apiErrorExample {html} False id of conversation
 */
/* DELETE conversation by id */
router.delete('/id/:id', authenticate, function (req, res) {
    // Only admins can delete conversations
    if (req.user.role == "admin") {
        Conversation.findByIdAndDelete(req.params.id, function (err, conversationById) {
            if (err) {
                return next(err);
            }
            // Supprimer avec succès
            res.send("Conversation supprimée");
        });
    } else {
        res.status(401).send("Vous n'avez pas les droits pour supprimer les conversation");
    }
});

/* ADD user to conversation */
router.patch('/addUser/conversation=:convId', authenticate, function (req, res) {
    Conversation.findById(req.params.convId).exec(function (err, conversationById) {
        if (err) {
            return next(err);
        }
        // Only admins can edit conversations
        if (req.user.role == "admin") {
            // Check if the user is already in the conversation
            if (conversationById.users.includes(req.body.user)) {
                res.status(401).send("L'utilisateur est déjà dans la conversation");
            } else {
                // Add the user to the conversation
                conversationById.users.push(req.body.user);
                // Save the conversation
                Conversation.findByIdAndUpdate(req.params.convId, conversationById, function (err, conversationById) {
                    if (err) {
                        return next(err);
                    }
                    // Send the saved document in the response
                    res.send(conversationById);
                });
            }
        } else {
            res.status(401).send("Vous n'avez pas les droits pour ajouter un utilisateur à la conversation");
        }
    });
});

/* PATCH conversation */
router.patch('/id/:id', authenticate, function (req, res) {
    // Only admins can edit conversations
    if (req.user.role == "admin") {
        Conversation.findByIdAndUpdate(req.params.id, req.body, function (err, conversationById) {
            if (err) {
                return next(err);
            }
            // Supprimer avec succès
            res.send("Conversation modifiée");
        });
    } else {
        res.status(401).send("Vous n'avez pas les droits pour modifier les conversation");
    }
});

export default router;