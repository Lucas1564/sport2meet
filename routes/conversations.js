import express from 'express';
import Conversation from '../models/conversation.js';
import {
    authenticate
} from "./auth.js";

const router = express.Router();

/* GET conversations listing. */
router.get('/', authenticate, function (req, res, next) {
    Conversation.find().sort('content').exec(function (err, conversations) {
        if (err) {
            return next(err);
        }
        res.send(conversations);
    });
});

/* POST new conversation */
router.post('/activity=:id', authenticate, function (req, res, next) {
    // Create a new document from the JSON in the request body
    const newConversation = new Conversation(req.body);
    newConversation.activity = req.params.id;
    users = [];
    users.push(req.user._id);
    newConversation.users = users;
    // Save that document
    newConversation.save(function (err, savedConversation) {
        if (err) {
            return next(err);
        }
        // Send the saved document in the response
        res.send(savedConversation);
    });
});

/* DELETE conversation by id */
router.delete('/id/:id', authenticate, function (req, res) {
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

/* PATCH conversation */
router.patch('/id/:id', authenticate, function (req, res) {
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