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

export default router;