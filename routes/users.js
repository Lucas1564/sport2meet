import express from "express";
import User from "../models/user.js"
import {
  authenticate
} from "./auth.js";

const router = express.Router();

/**
 * @api {get} /users Get all users
 * @apiGroup user
 * @apiName GetUsers
 * @apiExample Get all users :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * GET https://sport-2-meet.onrender.com/users
 * @apiSuccessExample {json} Get all user Success:
 * Status : 200 OK
 *[
 *    {
 *        "email": "alexia.leger@heig-vd.ch",
 *        "firstname": "Alexia",
 *        "lastname": "Leger",
 *        "role": "user",
 *        "registrationDate": "2022-11-14T07:44:54.998Z",
 *        "_id": "6371f1f63e3b5d0a631b4080"
 *    }
 *]
 * @apiErrorExample {html} User not logged in :
 * Status : 401 Unauthorized
 * Unauthorized
 */
/* GET users listing. */
router.get('/', function (req, res, next) {
  User.find().sort('name').exec(function (err, users) {
    if (err) {
      return next(err);
    }
    res.send(users);
  });
});

/**
 * @api {get} /users/id/:id Get user by id
 * @apiGroup user
 * @apiName GetUser
 * @apiParam (user) id User's id
 * @apiExample Get user 6371f1f63e3b5d0a631b4080
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * GET https://sport-2-meet.onrender.com/users/id/6371f1f63e3b5d0a631b4080
 * @apiSuccessExample {json} Get user by id Success:
 *{
 *    "email": "alexia.leger@heig-vd.ch",
 *    "firstname": "Alexia",
 *    "lastname": "Leger",
 *    "role": "user",
 *    "registrationDate": "2022-11-14T07:44:54.998Z",
 *    "_id": "6371f1f63e3b5d0a631b4080"
 *}
 * @apiErrorExample {html} False user's id :
 * Status : 404 Not Found
 * User not found
 */
/* GET user by id. */
router.get('/id/:id', function (req, res, next) {
  User.findById(req.params.id).exec(function (err, userById) {
    if (err) {
      return next(err);
    }
    if (userById) {
      res.send(userById);
    } else {
      res.status(404).send("User not found");
    }
  });
});

/**
 * @api {post} /users Create a user
 * @apiGroup user
 * @apiName CreateUser
 * @apiBody {String} email 
 * @apiBody {String{3..20}} firstname 
 * @apiBody {String{3..20}} lastname 
 * @apiBody {String{8..20}} password
 * @apiBody {String="user","admin"} type
 * @apiExample Create a user
 * POST https://sport-2-meet.onrender.com/users
 * {
 * "email" : "alexia.leger@heig-vd.ch",
 * "firstname" : "Alexia",
 * "lastname" : "Leger",
 * "password" : "alexialeger"
 *}
 * @apiSuccessExample {json} Create a user Success:
 * {
 *    "email": "alexia.leger@heig-vd.ch",
 *    "firstname": "Alexia",
 *    "lastname": "Leger",
 *    "role": "user",
 *    "registrationDate": "2022-11-14T07:44:54.998Z",
 *    "_id": "6371f1f63e3b5d0a631b4080"
 *}
 * @apiErrorExample {html} Missing required field :
 * Status : 500 Internal Server Error 
 * User validation failed: lastname: Path `lastname` is required.
 * @apiErrorExample {html} Lenght of password :
 * Status : 500 Internal Server Error 
 * Password is too short (8 characters minimum)
 * @apiErrorExample {html} Duplicate users :
 * Status : 500 Internal Server Error
 * E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "alexia.leger@heig-vd.ch" }
 */
/* POST new user */
router.post('/', function (req, res, next) {
  // Create a new document from the JSON in the request body
  const newUser = new User(req.body);
  // Save that document
  newUser.save(function (err, savedUser) {
    if (err) {
      return next(err);
    }
    // Send the saved document in the response
    res.send(savedUser);
  });
});

/**
 * @api {delete} /users/id/:id Delete a user
 * @apiGroup user
 * @apiName DeleteUser
 * @apiParam (user) id User's id
 * @apiExample Delete user 6371f5b33e3b5d0a631b4088 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * DELETE https://sport-2-meet.onrender.com/users/id/6371f5b33e3b5d0a631b4088
 * @apiSuccessExample {html} Delete user Success:
 * User supprimé
 * @apiErrorExample {html} Delete a user with false id :
 * Status : 401 Unauthorized
 * Unauthorized
 */
/* DELETE user by id */
router.delete('/id/:id', authenticate, function (req, res) {
  //if param id = req.id or role = admin, delete user by id and all the links with activities and comments
  if (req.user._id == req.params.id || req.user.role == "admin") {
    User.findByIdAndDelete(req.params.id, function (err, userById) {
      if (err) {
        return next(err);
      }
      if (userById) {
        // Supprimer avec succès
        res.send("User supprimé");
      } else {
        res.status(404).send("User not found");
      }
    });
  } else {
    //send unauthorized
    res.status(401).send("Vous n'avez pas les droits pour modifier cet utilisateur");
  }
});

/**
 * @api {patch} /users/id/:id Modify a user
 * @apiGroup user
 * @apiName ModifyUser
 * @apiParam (user) id User's id
 * @apiBody {String} email 
 * @apiBody {String{3..20}} firstname 
 * @apiBody {String{3..20}} lastname 
 * @apiBody {String{8..20}} password
 * @apiBody {String="user","admin"} type
 * @apiExample Modify user 6377514f6c436fedc645d019 :
 * Authorization:Bearer sjkshrbgflkergERGHERIGAwk
 * PATCH https://sport-2-meet.onrender.com/users/id/6377514f6c436fedc645d019
 * {
 *  "firstname" : "test modify"
 * }
 * @apiSuccessExample {html} Patch user Success:
 * User modifié
 * @apiErrorExample {html} Modify a user with false id :
 * Status : 401 Unauthorized
 * Vous n'avez pas les droits pour modifier cet utilisateur
 */
/* PATCH user */
router.patch('/id/:id', authenticate, function (req, res, next) {
  // patch only if req.user._id == req.params.id
  if (req.user._id == req.params.id || req.user.role == "admin") {
    // patch by req.params.body
    var userModif = req.body;
    User.findByIdAndUpdate(req.params.id, userModif, function (err, userById) {
      if (err) {
        return next(err);
      }
      if (userById) {
        // Supprimer avec succès
        res.send("User modifié");
      } else {
        res.status(404).send("User not found");
      }
    });
  } else {
    res.status(401).send("Vous n'avez pas les droits pour modifier cet utilisateur");
  }
});

export default router;