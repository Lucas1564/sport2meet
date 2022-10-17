import express from "express";
import User from "../models/user.js"

const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  User.find().sort('name').exec(function(err, users) {
    if (err) {
      return next(err);
    }
    res.send(users);
  });
});


/* GET user by id. */
router.get('/:id', function(req, res, next) {
  User.findById(req.params.id).exec(function(err, userById) {
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


/* POST new user */
router.post('/', function(req, res, next) {
  // Create a new document from the JSON in the request body
  const newUser = new User(req.body);
  // Save that document
  newUser.save(function(err, savedUser) {
    if (err) {
      return next(err);
    }
    // Send the saved document in the response
    res.send(savedUser);
  });
});

export default router;
