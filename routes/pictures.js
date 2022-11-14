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