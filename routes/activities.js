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

/* GET activities listing. */
router.get('/', function (req, res, next) {
    Activity.find().sort('sport').exec(function (err, activities) {
        if (err) {
            return next(err);
        }
        res.send(activities);
    });
});


/* POST new activity */
router.post('/', function (req, res, next) {
    // Create a new document from the JSON in the request body
    const newActivity = new Activity(req.body);
    var latitude = 0;
    var longitude = 0;
    axios.get('http://api.positionstack.com/v1/forward?access_key=f2c6db61c5b566356d8fc580c9f8ca13&query=' + newActivity.npa + ' ' + newActivity.locality + ',' + newActivity.address)
        .then(response => {
            latitude = response.data.data[0].latitude;
            longitude = response.data.data[0].longitude;
            newActivity.location = {
                type: "Point",
                coordinates: [latitude, longitude]
            };
            // Save that document
            newActivity.save(function (err, savedActivity) {
                if (err) {
                    return next(err);
                }
                // Link the activity to the user
                const newActivity_User = new activity_user({
                    activity: savedActivity._id,
                    user: savedActivity.creator,
                    inscription: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
                });
                newActivity_User.save(function (err, savedActivity_User) {
                    if (err) {
                        return next(err);
                    }
                    res.send(savedActivity);
                });
            });
        })
        .catch(error => {
            return next(error);
        });
});


export default router;
