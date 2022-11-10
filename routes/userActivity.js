import express from "express";
import Activity from "../models/activity.js"
import User from "../models/user.js"
import activity_user from "../models/activity_user.js"
import {
    authenticate
} from "./auth.js";
import geocoder from "node-geocoder";
import axios from "axios";

const router = express.Router();

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
            activity_user.create({
                activity: req.params.id,
                user: req.user._id,
                inscription: Date.now() + 3600000
            }, function (err, activityByUser) {
                if (err) {
                    return next(err);
                }
                res.send(activityByUser);
            });
        }
    });
});

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
            res.send("Vous avez quitté l'activité");
        } else {
            res.send("Vous n'êtes pas inscrit à cette activité");
        }
    });
});

export default router;