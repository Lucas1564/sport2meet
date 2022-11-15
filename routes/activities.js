import express from "express";
import Activity from "../models/activity.js"
import User from "../models/user.js"
import activity_user from "../models/activity_user.js"
import {
    authenticate
} from "./auth.js";
import geocoder from "node-geocoder";
import axios from "axios";
import formatLinkHeader from 'format-link-header';
import url from '../config.js'
import fileUpload from "express-fileupload";
import fs from "fs";
import Conversation from "../models/conversation.js";

const router = express.Router();
const __dirname = fs.realpathSync('.');

/**
 * @api {get} /activities Get all activities
 * @apiGroup activities
 * @apiName GetActivities
 * @apiExample Get all activities :
 * GET 127.0.0.1:3000/activities
 * @apiSuccessExample {json} Get all activities sucess:
 *[
 *    {
 *        "location": {
 *            "type": "Point",
 *            "coordinates": [
 *                46.779117,
 *                6.64187
 *            ]
 *        },
 *        "_id": "6371f8ce3e3b5d0a631b4092",
 *        "description": "test activité",
 *        "sport": "Course",
 *        "address": "Avenue des sports 4",
 *        "npa": 1400,
 *        "locality": "Yverdon",
 *        "players": 5,
 *        "datetime": "1970-01-01T00:00:00.012Z",
 *        "type": "Evénement",
 *        "creator": "6371f1f63e3b5d0a631b4080",
 *        "__v": 0
 *    },
 *    {
 *        "location": {
 *            "type": "Point",
 *            "coordinates": [
 *                46.779117,
 *                6.64187
 *            ]
 *        },
 *        "_id": "6371f92c3e3b5d0a631b4097",
 *        "description": "test activité",
 *        "sport": "Course",
 *        "address": "Avenue des sports 4",
 *        "npa": 1400,
 *        "locality": "Yverdon",
 *        "players": 5,
 *        "datetime": "2022-04-23T18:25:43.511Z",
 *        "type": "Evénement",
 *        "creator": "6371f1f63e3b5d0a631b4080",
 *        "__v": 0
 *    }
 *]
 */
// /* GET activities listing. */
router.get('/', function (req, res, next) {
    Activity.find().count(function (err, total) {
        if (err) {
            return next(err);
        }
        let query = Activity.find();

        // Parse the "page" param (default to 1 if invalid)
        let page = parseInt(req.query.page, 10);
        if (isNaN(page) || page < 1) {
            page = 1;
        }
        // Parse the "pageSize" param (default to 100 if invalid)
        let pageSize = parseInt(req.query.pageSize, 10);
        if (isNaN(pageSize) || pageSize < 0 || pageSize > 100) {
            pageSize = 100;
        }
        // Apply skip and limit to select the correct page of elements
        query = query.skip((page - 1) * pageSize).limit(pageSize);

        //Ceil for the last page
        let maxPage = Math.ceil(total / pageSize);

        //Paginated activities
        const links = {};

        function buildLinkUrl(url, page, pageSize) {
            return url + '?page=' + page + '&pageSize=' + pageSize;
        }
        // Add "first" and "prev" links unless it's the first page
        if (page > 1) {
            links.first = {
                rel: 'first',
                url: buildLinkUrl(url, 1, pageSize)
            };
            links.prev = {
                rel: 'prev',
                url: buildLinkUrl(url, page - 1, pageSize)
            };
        }
        // Add "next" and "last" links unless it's the last page
        if (page < maxPage) {
            links.next = {
                rel: 'next',
                url: buildLinkUrl(url, page + 1, pageSize)
            };
            links.last = {
                rel: 'last',
                url: buildLinkUrl(url, maxPage, pageSize)
            };
        }
        if (Object.keys(links).length >= 1) {
            res.set('Link', formatLinkHeader(links));
        }

        // Filter activities by sport
        if (req.query.sport) {
            query = query.where('sport').equals(req.query.sport);
        }

        // Filter activities by locality
        if (req.query.locality) {
            query = query.where('locality').equals(req.query.locality);
        }

        // Filter activities by npa
        if (req.query.npa) {
            query = query.where('npa').equals(req.query.npa);
        }

        // Filter activities by type
        if (req.query.type) {
            query = query.where('type').equals(req.query.type);
        }

        //Display the activities
        query.sort('sport').exec(function (err, activities) {
            if (err) {
                return next(err);
            }
            res.send(activities);
        });

    });
});


/**
 * @api {get} /activities/id/:id Get activity by id
 * @apiGroup activities
 * @apiName GetActivityById
 * @apiParam (activities) id Id of Activity
 * @apiExample Get activity 6371f8ce3e3b5d0a631b4092 :
 * GET 127.0.0.1:3000/activities/6371f8ce3e3b5d0a631b4092
 * @apiSuccessExample {json} Get activity 6371f8ce3e3b5d0a631b4092 success:
 *{
 *    "location": {
 *        "type": "Point",
 *        "coordinates": [
 *            46.779117,
 *            6.64187
 *        ]
 *    },
 *    "_id": "6371f8ce3e3b5d0a631b4092",
 *    "description": "test activité",
 *    "sport": "Course",
 *    "address": "Avenue des sports 4",
 *    "npa": 1400,
 *    "locality": "Yverdon",
 *    "players": 5,
 *    "datetime": "1970-01-01T00:00:00.012Z",
 *    "type": "Evénement",
 *    "creator": "6371f1f63e3b5d0a631b4080",
 *    "__v": 0
 *}
 * @apiErrorExample {html} False id of activity :
 * Status : 404 Not Found
 * Not Found
 */
/* GET activity by id. */
router.get('/id/:id', function (req, res, next) {
    Activity.findById(req.params.id).exec(function (err, activityById) {
        if (err) {
            return next(err);
        }
        res.send(activityById);
    });
});

/* GET Sport */
router.get('/sports', function (req, res, next) {
    Activity.find().distinct('sport').exec(function (err, sport) {
        if (err) {
            return next(err);
        }
        res.send(sport);
    });
});

/**
 * @api {get} /activities/id/:id Modifiy activity by id
 * @apiGroup activities
 * @apiName ModifyActivity
 * @apiParam (activities) id Id of activity
 * @apiExample Modify activity 6372013a3e3b5d0a631b40af :
 * PATCH 127.0.0.1:3000/activities/id/6372013a3e3b5d0a631b40af
 *{
 * "description" : "Test modification"
 *}
 * @apiSuccessExample {html} Modify activity 6372013a3e3b5d0a631b40af sucess:
 * Status : 200 OK
 * Activité modifiée avec succès !
 * @apiErrorExample {html} False id of activity :
 * Status : 500 Internal Server Error
 * Cast to ObjectId failed for value "6372013a3e3b5d0a631b40az" (type string) at path "_id" for model "Activity"
 */
/* PATCH activity by id. */
router.patch('/id/:id', authenticate, function (req, res, next) {
    //get creator of activity
    Activity.findById(req.params.id).exec(function (err, activityById) {
        if (err) {
            return next(err);
        }
        // patch only if req.user._id == activityById.creator
        if (req.user._id.toString() === activityById.creator.toString() || req.user.role == "admin") {
            // patch by req.params.body
            var activityModif = req.body;
            Activity.findByIdAndUpdate(req.params.id, activityModif, function (err, activityModifById) {
                if (err) {
                    return next(err);
                }
                res.send("Activité modifiée avec succès !");
            });
        } else {
            res.status(401).send("Vous n'avez pas les droits pour modifier cet activité");
        }
    });
});

/**
 * @api {delete} /activities/id/:id Delete activity by id
 * @apiGroup activities
 * @apiName DeleteActivity
 * @apiParam (activities) id Id of activity
 * @apiExample Delete activity 6372013a3e3b5d0a631b40af :
 * DELETE 127.0.0.1:3000/activities/id/6372013a3e3b5d0a631b40af
 * @apiSuccessExample {html} Delete activity 6372013a3e3b5d0a631b40af sucess:
 * Status : 200 OK
 * Activité supprimée avec succès
 * @apiErrorExample {html} False id of activity :
 * Status : 500 Internal Server Error
 * Cast to ObjectId failed for value "6372013a3e3b5d0a631b40az" (type string) at path "_id" for model "Activity"
 */
/* DELETE activity by id. */
router.delete('/id/:id', authenticate, function (req, res, next) {
    //get creator of activity
    Activity.findById(req.params.id).exec(function (err, activityById) {
        if (err) {
            return next(err);
        }
        //delete activity only if req.user._id == activityById.creator
        if (req.user._id.toString() === activityById.creator.toString() || req.user.role == "admin") {
            Activity.findByIdAndDelete(req.params.id, function (err, activityById) {
                if (err) {
                    return next(err);
                }
                res.send("Activité supprimée avec succès");
            });
        } else {
            res.status(401).send("Vous n'avez pas les droits pour modifier cet utilisateur");
        }
    });
});

/**
 * @api {post} /activities Create an activity
 * @apiGroup activities
 * @apiName CreateActivity
 * @apiExample Create an activity :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * POST 127.0.0.1:3000/activities
 *{
 * "description" : "test activité",
 * "sport" : "Course",
 * "address" : "Avenue des sports 4",
 * "npa" : "1400",
 * "locality" : "Yverdon",
 * "players" : 5,
 * "datetime" : "2022-04-23T18:25:43.511+00:00",
 * "type" : "Evénement"
 *}
 * @apiBody {String} description
 * @apiBody {String = "Course", "Vélo", "Natation", "Randonnée", "Ski", "Football", "Basketball", "Tennis", "Volleyball", "Baseball", "Football-American", "Golf", "Hockey", "Rugby", "Boxe", "Arts Martiaux", "Yoga", "Pilates", "Dance", "Fitness", "Crossfit", "Autre"} sport
 * @apiBody {String} address
 * @apiBody {String} npa
 * @apiBody {String} locality
 * @apiBody {Number} players
 * @apiBody {Datetime} datetime
 * @apiBody {String= "Evénement", "Tournoi", "Entraînement", "Autre"} type
 * @apiSuccessExample {json} Create an activity success:
 *{
 *    "description": "test activité",
 *    "sport": "Course",
 *    "address": "Avenue des sports 4",
 *    "npa": 1400,
 *    "locality": "Yverdon",
 *    "players": 5,
 *    "datetime": "2022-04-23T18:25:43.511Z",
 *    "type": "Evénement",
 *    "creator": "6371f1f63e3b5d0a631b4080",
 *    "location": {
 *        "type": "Point",
 *        "coordinates": [
 *            46.779117,
 *            6.64187
 *        ]
 *    },
 *    "_id": "6371f92c3e3b5d0a631b4097",
 *    "__v": 0
 *}
 * @apiErrorExample {html} Missing required field type :
 * Status : 500 Internal Servor Error
 * Activity validation failed: type: Path `type` is required.
 * @apiErrorExample {html} False value of field "Sport" :
 * Status : 500 Internal Servor Error
 * Activity validation failed: sport: `marche` is not a valid enum value for path `sport`.
 */
/* POST new activity */
router.post('/', authenticate, function (req, res, next) {
    //add creator to req.body
    req.body.creator = req.user._id;
    // Create a new document from the JSON in the request body
    const newActivity = new Activity(req.body);
    var latitude = 0;
    var longitude = 0;
    axios.get('http://api.positionstack.com/v1/forward?access_key=f2c6db61c5b566356d8fc580c9f8ca13&query=' + newActivity.npa + ' ' + newActivity.locality + ',' + newActivity.address)
        .then(response => {
            latitude = response.data.data[0].latitude;
            longitude = response.data.data[0].longitude;
            if (latitude != 0 && longitude != 0) {
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
                    });
                    const conversation = new Conversation({
                        activity: savedActivity._id,
                        users: [savedActivity.creator],
                        name: "Conversation de l'activité " + savedActivity._id,
                    });
                    conversation.save(function (err, savedConversation) {
                        if (err) {
                            return next(err);
                        }
                    });
                    res.send(savedActivity);
                });
            } else {
                res.status(500).send("Adresse non valide");
            }
        })
        .catch(error => {
            return next(error);
        });
});


export default router;