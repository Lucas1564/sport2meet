// import the dependencies
import express from "express";
import createError from "http-errors";
import logger from "morgan";
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import activitiesRouter from "./routes/activities.js";
import commentsRouter from "./routes/comments.js";
import authRouter from "./routes/auth.js";
import userActivityRouter from "./routes/userActivity.js";
import picturesRouter from "./routes/pictures.js";
import mongoose from 'mongoose';
import * as config from "./config.js";
import conversationRouter from "./routes/conversations.js";

mongoose.Promise = Promise;
mongoose.connect(config.databaseUrl);

// create the express app
const app = express();

// Log requests (except in test mode).
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

// Routes
app.use("/", express.static("docs"));
app.use("/docs", express.static("docs"));
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/activities", activitiesRouter);
app.use("/comments", commentsRouter);
app.use("/userActivity", userActivityRouter);
app.use("/pictures", picturesRouter);
app.use("/conversations", conversationRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});

export default app;