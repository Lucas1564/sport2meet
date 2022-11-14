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

const router = express.Router();

// /* GET activities listing. */
router.get('/', function(req, res, next) {
    Activity.find().count(function(err, total) {
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
        links.first = { rel: 'first', url: buildLinkUrl(url, 1, pageSize) };
        links.prev = { rel: 'prev', url: buildLinkUrl(url, page - 1, pageSize) };
        }
        // Add "next" and "last" links unless it's the last page
        if (page < maxPage) {
        links.next = { rel: 'next', url: buildLinkUrl(url, page + 1, pageSize) };
        links.last = { rel: 'last', url: buildLinkUrl(url, maxPage, pageSize) };
        }
        if (Object.keys(links).length >= 1) {
        res.set('Link', formatLinkHeader(links));
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
  



/* GET activity by id. */
router.get('/id/:id', function (req, res, next) {
    Activity.findById(req.params.id).exec(function (err, activityById) {
        if (err) {
            return next(err);
        }
        res.send(activityById);
    });
});

/* GET avtivity by user. */
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

/* PATCH activity by id. */
router.patch('/id/:id', authenticate, function (req, res, next) {
    //get creator of activity
    Activity.findById(req.params.id).exec(function (err, activityById) {
        if (err) {
            return next(err);
        }
        // patch only if req.user._id == activityById.creator
        if (req.user._id == activityById.creator || req.user.role == "admin") {
            // patch by req.params.body
            var activityModif = req.body;
            Activity.findByIdAndUpdate(req.params.id, activityModif, function (err, activityById) {
                if (err) {
                    return next(err);
                }
                res.send("Activité modifiée avec succès \n");
            });
        } else {
            res.send("Vous n'avez pas les droits pour modifier cette activité");
        }
    });
});


/* DELETE activity by id. */
router.delete('/id/:id', authenticate, function (req, res, next) {
    //get creator of activity
    Activity.findById(req.params.id).exec(function (err, activityById) {
        if (err) {
            return next(err);
        }
        //delete activity only if req.user._id == activityById.creator
        if (req.user._id == activityById.creator || req.user.role == "admin") {
            Activity.findByIdAndDelete(req.params.id, function (err, activityById) {
                if (err) {
                    return next(err);
                }
                res.send("Activité supprimée avec succès");
            });
        } else {
            res.send("Vous n'avez pas les droits pour supprimer cette activité");
        }
    });
});

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