import express from "express";
import User from "../models/user.js"
import {
  authenticate
} from "./auth.js";

const router = express.Router();

/* GET users listing. */
router.get('/', authenticate, function (req, res, next) {
  User.find().sort('name').exec(function (err, users) {
    if (err) {
      return next(err);
    }
    res.send(users);
  });
});


/* GET user by id. */
router.get('/:id', function (req, res, next) {
  User.findById(req.params.id).exec(function (err, userById) {
    if (err) {
      return next(err);
    }
    res.send(userById);
  });
});

/* DELETE user by id. 
router.delete('/:id', function(req, res, next) {
  User.findById(req.params.id).exec(function(err, userById) {
    if (err) {
      return next(err);
    }
    res.send("User supprimé avec succès");
  });
});*/

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
      res.send("User modifié avec succès \n" + userById);
    });
  } else {
    res.send("Vous n'avez pas les droits pour modifier cet utilisateur");
  }
});



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

export default router;