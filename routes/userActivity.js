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
 * POST 127.0.0.1:3000/userActivity/join/6371f8ce3e3b5d0a631b4092
 * @apiSuccessExample {json} Join activity 6371f8ce3e3b5d0a631b4092 success:
 *{
 *    "activity": "6371f8ce3e3b5d0a631b4092",
 *    "user": "6371f1f63e3b5d0a631b4080",
 *    "inscription": "2022-11-14T09:39:56.567Z",
 *    "_id": "6371fedc3e3b5d0a631b40a5",
 *    "__v": 0
 *}
 * @apiErrorExample {} False id of activity :
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
        if (UserActivity) {
            res.send("Vous êtes déjà inscrit à cette activité");
        } else {
            // find activity by id
            Activity.findById(req.params.id).exec(function (err, activityById) {
                if (err) {
                    return next(err);
                }
                if (activityById) {
                    activity_user.create({
                        activity: req.params.id,
                        user: req.user._id,
                        inscription: Date.now() + 3600000
                    }, function (err, activityByUser) {
                        if (err) {
                            return next(err);
                        }
                        // join conversation
                        Conversation.findOne({
                            activity: req.params.id
                        }).exec(function (err, conversation) {
                            if (err) {
                                return next(err);
                            }
                            if (conversation) {
                                conversation.users.push(req.user._id);
                                conversation.save();
                                conversation.users.forEach(user => {
                                    if (user.toString() != req.user._id.toString()) {
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
 * @api {post} /userActivity/join/:id User leaves an activity
 * @apiGroup userActivity
 * @apiName LeaveActivity
 * @apiParam (userActivity) id Id of activity
 * @apiExample Leave activity 6371f8ce3e3b5d0a631b4092 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * DELETE 127.0.0.1:3000/userActivity/leave/6371f8ce3e3b5d0a631b4092
 * @apiSuccessExample {html} Leave activity 6371f8ce3e3b5d0a631b4092 sucess :
 * Vous avez quitté l'activité
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
                if (conversation) {
                    conversation.users.pull(req.user._id);
                    conversation.save();
                    conversation.users.forEach(user => {
                        if (user.toString() != req.user._id.toString()) {
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