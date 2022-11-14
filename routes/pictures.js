import express from "express";
import Activity from "../models/activity.js"
import User from "../models/user.js"
import activity_user from "../models/activity_user.js"
import Picture from "../models/picture.js"
import {
    authenticate
} from "./auth.js";
import geocoder from "node-geocoder";
import axios from "axios";
import fileUpload from "express-fileupload";
import fs from "fs";

const router = express.Router();
const __dirname = fs.realpathSync('.');

/**
* @api {post} /pictures/activity/:id Create a picture
* @apiGroup picture
* @apiName CreatePicture
* @apiBody {String} name
* @apiParam (picture) id Id of activity
* @apiExample Create a picture
* Authorization:Bearer sjkshrbgflkergERGHERIGAwk
* POST 127.0.0.1:3000/pictures/activity/6371f92c3e3b5d0a631b4097
* form-data :
* Key : pictures (files)
* Value : Capture d'écran_20221111_085342.png
* @apiSuccessExample {html} Create a user :
* Status : 200 OK
* 1 picture uploaded !
*/
/* POST picture for activity */
router.post('/activity/:id', authenticate, fileUpload({
    limits: {
        fileSize: 50 * 1024 * 1024,
        createParentPath: true,
    },
}), function (req, res, next) {
    activity_user.findOne({
        activity: req.params.id,
        user: req.user._id
    }).exec(async function (err, UserActivity) {
        if (err) {
            return next(err);
        }
        if (UserActivity) {
            if (req.files === null) {
                return res.status(400).json({
                    msg: 'No file uploaded'
                });
            }

            const images = req.files.picture;
            var nbrImages = images.length;
            if (nbrImages === undefined) {
                const image = images;
                const name = image.name;
                const path = __dirname + '/public/upload/' + Date.now() + "_" + name;
                image.mv(path, function (err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send(err);
                    }
                });
                const picture = new Picture({
                    name: Date.now() + "_" + name,
                    path: path,
                    activity: req.params.id,
                    creator: req.user._id,
                    mimetype: image.mimetype,
                    size: image.size,
                    createAt: Date.now()
                });
                await picture.save();
            } else {
                for (let i = 0; i < nbrImages; i++) {
                    const image = images[i];
                    const name = image.name;
                    const path = __dirname + '/public/upload/' + Date.now() + "_" + name;
                    image.mv(path, function (err) {
                        if (err) {
                            console.error(err);
                            return res.status(500).send(err);
                        }
                    });
                    const picture = new Picture({
                        name: Date.now() + "_" + name,
                        path: path,
                        activity: req.params.id,
                        creator: req.user._id,
                        mimetype: image.mimetype,
                        size: image.size,
                        createAt: Date.now()
                    });
                    await picture.save();
                }
            }
            if (nbrImages > 1) {
                res.send(nbrImages + ' pictures uploaded !');
            } else {
                res.send("1 picture uploaded !");
            }
        } else {
            res.send("Vous n'êtes pas inscrit à cette activité");
        }
    });
});


/**
* @api {get} /pictures/activity/:id Get picture by activity
* @apiGroup picture
* @apiName GetPictureByActivity
* @apiParam (picture) id Id of activity
* @apiExample Get picture for activity 6371f92c3e3b5d0a631b4097
* Authorization:Bearer sjkshrbgflkergERGHERIGAwk
* GET 127.0.0.1:3000/pictures/activity/6371f92c3e3b5d0a631b4097
* @apiSuccessExample {html} Create a user :
* Status : 200 OK
* [
    {
        "_id": "637249c66c88bee7a99edb9a",
        "name": "1668434374419_013_10.JPG",
        "creator": {
            "email": "alexia.leger@heig-vd.ch",
            "firstname": "Alexia",
            "lastname": "Leger",
            "role": "user",
            "registrationDate": "2022-11-14T07:44:54.998Z",
            "id": "6371f1f63e3b5d0a631b4080"
        },
        "path": "C:\\Users\\Maintenant Pret\\Documents\\ArchiOWeb\\projet\\sport2meet/public/upload/1668434374419_013_10.JPG",
        "activity": "6371f92c3e3b5d0a631b4097",
        "mimetype": "image/jpeg",
        "size": 375154,
        "createAt": "2022-11-14T13:59:34.419Z",
        "__v": 0
    },
    {
        "_id": "63724b1e1f1738af5b28fb55",
        "name": "1668434718354_013_10.JPG",
        "creator": {
            "email": "alexia.leger@heig-vd.ch",
            "firstname": "Alexia",
            "lastname": "Leger",
            "role": "user",
            "registrationDate": "2022-11-14T07:44:54.998Z",
            "id": "6371f1f63e3b5d0a631b4080"
        },
        "path": "C:\\Users\\Maintenant Pret\\Documents\\ArchiOWeb\\projet\\sport2meet/public/upload/1668434718353_013_10.JPG",
        "activity": "6371f92c3e3b5d0a631b4097",
        "mimetype": "image/jpeg",
        "size": 375154,
        "createAt": "2022-11-14T14:05:18.354Z",
        "__v": 0
    },
]
* @apiErrorExample {html} False id of activity :
*/
/* GET picture by activity. */
router.get('/activity/:id', function (req, res, next) {
    Picture.find({
        activity: req.params.id
    }).populate('creator').exec(function (err, pictureByActivity) {
        if (err) {
            return next(err);
        }
        if (pictureByActivity) {
            res.send(pictureByActivity);
        } else {
            res.send("Aucune photo pour cette activité");
        }
    });
});

/**
* @api {get} /pictures/user/:id Get picture by user
* @apiGroup picture
* @apiName GetPictureByUser
* @apiParam (picture) id Id of user
* @apiExample Get picture for user 6371f1f63e3b5d0a631b4080
* Authorization:Bearer sjkshrbgflkergERGHERIGAwk
* GET 127.0.0.1:3000/pictures/user/6371f1f63e3b5d0a631b4080
* @apiSuccessExample {html} Get picture for user 6371f1f63e3b5d0a631b4080:
*Status : 200 OK
*[
*    {
*        "_id": "63724a26b05e21878f3aabab",
*        "name": "1668434470330_013_10.JPG",
*        "creator": "6371f1f63e3b5d0a631b4080",
*        "path": "C:\\Users\\Maintenant Pret\\Documents\\ArchiOWeb\\projet\\sport2meet/public/upload/1668434470329_013_10.JPG",
*        "activity": {
*            "location": {
*                "type": "Point",
*                "coordinates": [
*                    46.779117,
*                    6.64187
*                ]
*            },
*            "_id": "6371f92c3e3b5d0a631b4097",
*            "description": "test activité",
*            "sport": "Course",
*            "address": "Avenue des sports 4",
*            "npa": 1400,
*            "locality": "Yverdon",
*            "players": 5,
*           "datetime": "2022-04-23T18:25:43.511Z",
*            "type": "Evénement",
*            "creator": "6371f1f63e3b5d0a631b4080",
*            "__v": 0
*        },
*        "mimetype": "image/jpeg",
*        "size": 375154,
*        "createAt": "2022-11-14T14:01:10.330Z",
*        "__v": 0
*   },
*    {
*        "_id": "63724ad089244a774a587221",
*        "name": "1668434640346_013_10.JPG",
*        "creator": "6371f1f63e3b5d0a631b4080",
*        "path": "C:\\Users\\Maintenant Pret\\Documents\\ArchiOWeb\\projet\\sport2meet/public/upload/1668434640345_013_10.JPG",
*        "activity": {
*            "location": {
*                "type": "Point",
*                "coordinates": [
*                    46.779117,
*                    6.64187
*                ]
*            },
*            "_id": "6371f92c3e3b5d0a631b4097",
*            "description": "test activité",
*            "sport": "Course",
*            "address": "Avenue des sports 4",
*            "npa": 1400,
*            "locality": "Yverdon",
*            "players": 5,
*            "datetime": "2022-04-23T18:25:43.511Z",
*            "type": "Evénement",
*            "creator": "6371f1f63e3b5d0a631b4080",
*            "__v": 0
*        },
*        "mimetype": "image/jpeg",
*        "size": 375154,
*        "createAt": "2022-11-14T14:04:00.346Z",
*        "__v": 0
*    },
*]
* @apiErrorExample {html} False user's id :
*/
/* GET picture by user. */
router.get('/user/:id', function (req, res, next) {
    Picture.find({
        creator: req.params.id
    }).populate('activity').exec(function (err, pictureByUser) {
        if (err) {
            return next(err);
        }
        if (pictureByUser) {
            res.send(pictureByUser);
        } else {
            res.send("Aucune photo pour cet utilisateur");
        }
    });
});

/**
* @api {patch} /pictures/:id Modify picture by id
* @apiGroup picture
* @apiName ModifyPictureBy)Id
* @apiParam (picture) id Id of picture
* @apiExample Get picture 
* Authorization:Bearer sjkshrbgflkergERGHERIGAwk
* PATCH 127.0.0.1:3000/pictures/63724939654d44c5b82c1d17
* @apiSuccessExample {html} Get picture 63724939654d44c5b82c1d17:
*
* @apiErrorExample {html} False id of picture :
*
* @apiErrorExample {html} User is not the creator of the picture :
* Status : 403 Forbidden
* Vous n'avez pas les droits pour modifier cette photo
*/
/* PATCH picture by id. */
router.patch('/:id', authenticate, fileUpload({
    limits: {
        fileSize: 50 * 1024 * 1024,
        createParentPath: true,
    },
}), function (req, res, next) {
    Picture.findById(req.params.id).exec(async function (err, picture) {
        if (err) {
            return next(err);
        }
        if (picture.creator == req.user._id || req.user.role == "admin") {
            if (picture) {
                if (req.files === null) {
                    return res.status(400).json({
                        msg: 'No file uploaded'
                    });
                }
                // Delete old picture
                fs.unlink(picture.path, (err) => {
                    if (err) {
                        console.error(err)
                        return res.status(500).send(err);
                    }
                });
                const image = req.files.picture;
                const name = image.name;
                const path = __dirname + '/public/upload/' + Date.now() + "_" + name;
                image.mv(path, function (err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send(err);
                    }
                });
                picture.name = Date.now() + "_" + name;
                picture.path = path;
                picture.mimetype = image.mimetype;
                picture.size = image.size;
                picture.createAt = Date.now();
                await picture.save();
                res.send("Picture updated !");
            } else {
                res.status(404).send("Picture not found");
            }
        } else {
            res.status(403).send("Vous n'avez pas les droits pour modifier cette photo");
        }
    });
});
/**
* @api {delete} /pictures/:id Delete picture by id
* @apiGroup picture
* @apiName DeletePictureBy)Id
* @apiParam (picture) id Id of picture
* @apiExample Get picture 
* Authorization:Bearer sjkshrbgflkergERGHERIGAwk
* DELETE 127.0.0.1:3000/pictures/63724939654d44c5b82c1d17
* @apiSuccessExample {html} Delete picture 63724939654d44c5b82c1d17:
*
* @apiErrorExample {html} False id of picture :
*
*/
/* DELETE picture by id. */
router.delete('/:id', authenticate, function (req, res, next) {
    Picture.findById(req.params.id).exec(function (err, picture) {
        if (err) {
            return next(err);
        }
        if (picture) {
            if (picture.creator.toString() == req.user._id.toString() || req.user.role == "admin") {
                fs.unlink(picture.path, (err) => {
                    if (err) {
                        console.error(err)
                        return res.status(500).send(err);
                    }
                });
                Picture.findByIdAndRemove(req.params.id, function (err, picture) {
                    if (err) {
                        return next(err);
                    }
                    res.send("Picture deleted");
                });
            } else {
                res.status(403).send("Vous n'êtes pas le propriétaire de cette photo");
            }
        } else {
            res.send("Cette photo n'existe pas");
        }
    });
});
export default router;