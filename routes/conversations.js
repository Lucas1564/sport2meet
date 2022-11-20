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
 * @apiDescription Pour créer une conversation, il faut utiliser le serveur websocket. Voir le README.md. 
 */
/* POST new conversation */
router.post('/activity=:id', authenticate, function (req, res, next) {
    // Create a new document from the JSON in the request body
    const newConversation = new Conversation(req.body);
    newConversation.activity = req.params.id;
    var users = [];
    users.push(req.user._id);
    console.log(users);
    console.log("test");
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
 * @apiParam (conversations) id Id of conversation
 * @apiExample Delete conversation 63777bf8ec157793f6cb0a12
 * Authorization Bearer iéebrgéjebruoe (admin)
 * DELETE https://sport-2-meet.onrender.com/conversations/id/63777bf8ec157793f6cb0a12
 * @apiSuccess (conversations) {html} Message Success message
 * @apiSuccessExample {html} Success response :
 * Conversation supprimée
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

/**
 * @api {patch} /conversations/addUser/conversation=:convId Add a user to a conversation
 * @apiGroup conversations
 * @apiName GetAUserToAConversation
 * @apiExample Add user 637251e3abb31189cb4cfcc1 to conversation 63777bf8ec157793f6cb0a12
 * Authorization Bearer iéebrgéjebruoe (admin)
 * PATCH https://sport-2-meet.onrender.com/conversations/addUser/conversation=63777bf8ec157793f6cb0a12 
 * @apiSuccess (conversations) {json} Conversation Content of requested conversation
 * @apiSuccessExample {json} Success response :
 * {
    "_id": "63777bf8ec157793f6cb0a12",
    "name": "Conversation de l'activité 63777bf8ec157793f6cb0a0f",
    "users": [
        "6377514f6c436fedc645d019",
        "637a4683ddc8dc86fcd6b889"
    ],
    "activity": "63777bf8ec157793f6cb0a0f",
    "__v": 3
}
 * 
 */
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

/**
 * @api {patch} /conversations/id/:id Modify a conversation by id
 * @apiGroup conversations
 * @apiName ModifyConversationById
 * @apiParam (conversations) id Id of conversation
 * @apiExample Modify conversation 63777bf8ec157793f6cb0a12 :
 * Authorization Bearer iéebrgéjebruoe (admin)
 * PATCH https://sport-2-meet.onrender.com/conversations/id/63777bf8ec157793f6cb0a12
 * {
 *  "name" : "modification nom"
 * }
 * @apiSuccess (conversations) {html} Message Success message
 * @apiSuccessExample {html} Success response :
 * Conversation modifiée
 * 
 */
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