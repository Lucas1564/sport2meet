import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import * as config from "../config.js";

const router = express.Router();

/**
 * @api {post} /auth/login Login
 * @apiGroup login
 * @apiName UserLogin
 * @apiExample Login :
 * POST https://sport-2-meet.onrender.com/auth/login
 *{
 * "email" : "alexia.leger@heig-vd.ch",
 * "password" : "alexialeger"
 *}
 * @apiSuccessExample {json} Login success :
 * Status : 200 OK
 *{
 *    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MzcxZjFmNjNlM2I1ZDBhNjMxYjQwODAiLCJpYXQiOjE2Njg0MTIyMTQsImV4cCI6MTY2OTAxNzAxNH0.c2_hZ5heHFs1TvD1dgYQcaCN-mxRoWo48R9_kyskQhM"
 *}
 * @apiErrorExample {html} False password :
 * Status : 401 Unauthorized
 * Bad login
 * @apiErrorExample {html} False email :
 * Status : 401 Unauthorized
 * Bad login
 */
router.post('/login', async (req, res, next) => {
    try {
        const user = await User.findOne({
            email: req.body.email
        });
        if (!user) {
            res.status(401).send('Bad login');
            return;
        }

        const password = req.body.password;
        const passwordHash = user.passwordHash;
        // Compare the password with the hash
        const valid = await bcrypt.compare(password, passwordHash);
        if (valid) {
            // Create a token
            const subject = user._id;
            const expiresIn = '7 days';
            jwt.sign({
                sub: subject
            }, config.jwtSecret, {
                expiresIn
            }, (err, token) => {
                if (err) {
                    next(err);
                } else {
                    res.send({
                        token
                    });
                }
            });
        } else {
            res.status(401).send('Bad login');
        }
    } catch (err) {
        next(err);
    }
});

export default router;


export function authenticate(req, res, next) {
    // Get the token from the request header
    const authorizationHeader = req.get('Authorization');
    // Check if the header is present
    if (!authorizationHeader) {
        return res.sendStatus(401);
    }

    const match = authorizationHeader.match(/^Bearer (.+)/);
    if (!match) {
        return res.sendStatus(401);
    }

    const bearerToken = match[1];
    // Verify the token
    jwt.verify(bearerToken, config.jwtSecret, (err, payload) => {
        if (err) {
            return res.sendStatus(401);
        }

        // Find the user by ID and attach it to the request.
        User.findById(payload.sub).then(user => {
            if (!user) {
                return res.sendStatus(401);
            } else {
                req.user = user;
            }
        }).then(() => {
            next();
        }).catch(err => {
            next(err);
        });
    });
}

export function tokenToUser(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    try {
        const payload = jwt.verify(token, config.jwtSecret);
        return User.findById(payload.sub);
    } catch (err) {
        return null;
    }
}