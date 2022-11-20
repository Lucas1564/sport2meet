import express from "express";
import Activity from "../models/activity.js"
import User from "../models/user.js"
import activity_user from "../models/activity_user.js"
import Conversation from "../models/conversation.js"
import {
    sendMessageToSpecificUser
} from "../ws.js";
import {
    authenticate
} from "./auth.js";

const router = express.Router();

/**
 * @api {get} /userActivity/user Get activity by user
 * @apiGroup userActivity
 * @apiName GetActivityByUser
 * @apiExample Get activities for user 6377514f6c436fedc645d019 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * GET https://sport-2-meet.onrender.com/userActivity/user
 * @apiSuccess (userActivity) {json} Activities Tab of activities of requested user
 * @apiSuccessExample {json} Success response:
 * Status : 200 OK
 * [
    {
        "_id": "63777bf8ec157793f6cb0a11",
        "activity": {
            "location": {
                "type": "Point",
                "coordinates": [
                    46.779117,
                    6.64187
                ]
            },
            "_id": "63777bf8ec157793f6cb0a0f",
            "description": "test",
            "sport": "Tennis",
            "address": "Avenue des sports 4",
            "npa": 1400,
            "locality": "Yverdon",
            "players": 5,
            "datetime": "2022-04-23T18:25:43.511Z",
            "type": "Tournoi",
            "creator": "6377514f6c436fedc645d019",
            "__v": 0
        },
        "user": "6377514f6c436fedc645d019",
        "inscription": "2022-11-18T14:35:04.690Z",
        "__v": 0
    }
]
 * @apiError (userActivity) {html} Message Error message
 * @apiErrorExample {html} User not authenticate :
 * Status : 401 Unauthorized
 * Unauthorized
 */
/* GET activity by user. */
router.get('/user', authenticate, function (req, res, next) {
    activity_user.find({
        user: req.user._id
    }).populate('activity').exec(function (err, activityByUser) {
        if (err) {
            return next(err);
        }
        res.send(activityByUser);
    });

});

/**
 * @api {get} /userActivity/user/aggregate Aggregate activities by user
 * @apiGroup userActivity
 * @apiName AggregateActivityByUser
 * @apiExample Aggregate activities for user 6377514f6c436fedc645d019 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * GET https://sport-2-meet.onrender.com/userActivity/user
 * @apiSuccess (userActivity) {html} Message Success message
 * @apiSuccessExample {html} Success response:
 * Status : 200 OK
 * Vous avez participé à 1 activités
 * @apiError (userActivity) {html} Message Error message
 * @apiErrorExample {html} User not connected :
 * Status : 401 Unauhtorized
 * Unauthorized
 */ 
/* aggregate all activities by user */
router.get('/user/aggregate', authenticate, function (req, res, next) {
    activity_user.aggregate([{
        $match: {
            user: req.user._id
        }
    }, {
        $group: {
            _id: "$activity",
        }
    }]).exec(function (err, activityByUser) {
        if (err) {
            return next(err);
        }
        res.send("Vous avez participé à " + activityByUser.length + " activités");
    });
});

/**
 * @api {post} /userActivity/join/:id User joins an activity
 * @apiGroup userActivity
 * @apiName JoinActivity
 * @apiParam (userActivity) id Id of activity
 * @apiExample Join activity 6371f8ce3e3b5d0a631b4092 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * POST https://sport-2-meet.onrender.com/userActivity/join/6371f8ce3e3b5d0a631b4092
 * @apiSuccess (userActivity) {json} Inscription Registration summary
 * @apiSuccessExample {json} Success response:
 *{
 *    "activity": "6371f8ce3e3b5d0a631b4092",
 *    "user": "6371f1f63e3b5d0a631b4080",
 *    "inscription": "2022-11-14T09:39:56.567Z",
 *    "_id": "6371fedc3e3b5d0a631b40a5",
 *    "__v": 0
 *}
 * @apiError (userActivity) {html} Message Error message
 * @apiErrorExample {html} False id of activity :
 * Status : 404 Not Found
 * Activité non trouvée
 */
/* JOIN activity for a user. */
router.post('/join/:id', authenticate, function (req, res, next) {
    // find activity_user by activity and user
    activity_user.findOne({
        activity: req.params.id,
        user: req.user._id
    }).exec(function (err, UserActivity) {
        if (err) {
            return next(err);
        }
        // Test if user is already in activity
        if (UserActivity) {
            res.send("Vous êtes déjà inscrit à cette activité");
        } else {
            // find activity by id
            Activity.findById(req.params.id).exec(function (err, activityById) {
                if (err) {
                    return next(err);
                }
                // If activity is found
                if (activityById) {
                    // Create new activity_user
                    activity_user.create({
                        activity: req.params.id,
                        user: req.user._id,
                        inscription: Date.now() + 3600000
                    }, function (err, activityByUser) {
                        if (err) {
                            return next(err);
                        }
                        // Join the conversation of the activity
                        Conversation.findOne({
                            activity: req.params.id
                        }).exec(function (err, conversation) {
                            if (err) {
                                return next(err);
                            }
                            // If conversation is found
                            if (conversation) {
                                // Add user to conversation
                                conversation.users.push(req.user._id);
                                conversation.save();
                                // Send message to user to inform him that he joined the activity
                                conversation.users.forEach(user => {
                                    if (user.toString() != req.user._id.toString()) {
                                        // Send message to user to inform him that he joined the activity CODE JOIN_ACTIVITY
                                        sendMessageToSpecificUser({
                                            "data": {
                                                "message": {
                                                    "content": "L'utilisateur " + req.user.firstname + " " + req.user.lastname + " a rejoint l'activité",
                                                },
                                                "conversation": {
                                                    "id": conversation._id,
                                                    "name": conversation.name,
                                                },
                                                "sender": {
                                                    "id": req.user._id,
                                                    "username": req.user.firstname + " " + req.user.lastname,
                                                },
                                                "date": Date.now()
                                            },
                                        }, user, "JOIN_ACTIVITY");
                                    }
                                });
                            }
                        });
                        res.send(activityByUser);
                    });
                } else {
                    res.status(404).send("Activité non trouvée");
                }
            });
        }
    });
});

/**
 * @api {delete} /userActivity/leave/:id User leaves an activity
 * @apiGroup userActivity
 * @apiName LeaveActivity
 * @apiParam (userActivity) id Id of activity
 * @apiExample Leave activity 6371f8ce3e3b5d0a631b4092 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * DELETE https://sport-2-meet.onrender.com/userActivity/leave/6371f8ce3e3b5d0a631b4092
 * @apiSuccess (userActivity) {html} Message Success message
 * @apiSuccessExample {html} Success response:
 * Vous avez quitté l'activité
 * @apiError (userActivity) {html} Message Error message
 * @apiErrorExample {html} False id of activity :
 * Status : 404 Not Found
 * Vous n'êtes pas inscrit à cette activité
 */
/* LEAVE activity for a user. */
router.delete('/leave/:id', authenticate, function (req, res, next) {
    activity_user.findOneAndDelete({
        activity: req.params.id,
        user: req.user._id
    }).exec(function (err, UserActivity) {
        if (err) {
            return next(err);
        }
        if (UserActivity) {
            // leave conversation
            Conversation.findOne({
                activity: req.params.id
            }).exec(function (err, conversation) {
                if (err) {
                    return next(err);
                }
                // If conversation is found
                if (conversation) {
                    // Remove user from conversation
                    conversation.users.pull(req.user._id);
                    conversation.save();
                    // Send message to user to inform him that he left the activity
                    conversation.users.forEach(user => {
                        if (user.toString() != req.user._id.toString()) {
                            // Send message to user to inform him that he left the activity CODE LEAVE_ACTIVITY
                            sendMessageToSpecificUser({
                                "data": {
                                    "message": {
                                        "content": "L'utilisateur " + req.user.firstname + " " + req.user.lastname + " a quitté l'activité",
                                    },
                                    "conversation": {
                                        "id": conversation._id,
                                        "name": conversation.name,
                                    },
                                    "sender": {
                                        "id": req.user._id,
                                        "username": req.user.firstname + " " + req.user.lastname,
                                    },
                                    "date": Date.now()
                                },
                            }, user, "LEAVE_ACTIVITY");
                        }
                    });
                }
            });
            res.send("Vous avez quitté l'activité");
        } else {
            res.status(404).send("Vous n'êtes pas inscrit à cette activité");
        }
    });
});

export default router;