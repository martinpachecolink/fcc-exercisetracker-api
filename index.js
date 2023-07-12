const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

let bodyParser = require("body-parser");

const mongoURI = process.env["MONGO_URI"];

// Call mongoose lib
const mongoose = require("mongoose");

// Connect to mongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define user schema and model
const userSchema = new mongoose.Schema(
  {
    username: String
  },
  { versionKey: false }
);
const User = mongoose.model("User", userSchema);

// Define Exercise schema and model
const exerciseSchema = new mongoose.Schema(
  {
    username: String,
    description: String,
    duration: Number,
    date: Date
  },
  { versionKey: false }
);
const Exercise = new mongoose.model("Exercise", exerciseSchema);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// USERS
app.get("/api/users", async function (req, res) {
  let users = await getAllUsers();

  res.send(users);
});

app.post("/api/users", async function (req, res) {
  let startedTime = new Date();
  let endedTime;

  let username = req.body.username;

  let data = {};

  let savedUser = await saveUser({ username: username });

  console.log(savedUser);

  data["username"] = savedUser["username"];
  data["_id"] = savedUser["_id"];

  endedTime = new Date();
  let duration = Math.abs(endedTime - startedTime);
  //data['duration'] = duration;
  //data['date']  = endedTime.toDateString();

  console.log("data: ", data);

  res.send(data);
});

// EXERCISES
app.post("/api/users/:_id/exercises", async function (req, res) {
  let id, description, duration, date;

  id = req.params._id;
  description = req.body.description;
  duration = req.body.duration;

  let user = await getUser(id);

  if (req.body.date) {
    date = new Date(req.body.date).toDateString();
  } else {
    date = new Date().toDateString();
  }

  console.log("userId: ", id);

  let savedExerciseDoc = await saveExercise({
    description: description,
    duration: duration,
    date: date,
    username: user.username
  });

  let savedExercise = JSON.parse(JSON.stringify(savedExerciseDoc));

  savedExercise["_id"] = user["_id"];

  console.log(
    "datee->",
    savedExercise.date,
    new Date(savedExercise.date).toDateString()
  );

  savedExercise["date"] = new Date(savedExercise.date).toDateString();

  console.log(savedExercise);

  res.send(savedExercise);
});

// LOGS
app.get("/api/users/:_id/logs", async function (req, res) {
  let id = req.params._id;

  let data = {};

  let user = await getUser(id);

  let exercises = [];
  let exercisesResult = await getAllExercisesFromUser(
    user.username,
    req.query.from,
    req.query.to,
    req.query.limit
  );

  exercises = exercisesResult.map((exercise) => {
    let e = JSON.parse(JSON.stringify(exercise));
    e.date = new Date(e.date).toDateString();
    return e;
  });

  console.log(exercises);

  data.username = user.username;
  data["_id"] = user["_id"];
  data.log = exercises;
  data.count = exercises.length;

  console.log("data------->", data);

  res.send(data);
});

// EXERCISE HELPER FUNCTIONS
async function saveExercise(exercise) {
  let exerciseModel = new Exercise(exercise);

  console.log("saving exercise...");

  let exerciseSaved = await exerciseModel.save();
  return exerciseSaved;
}

async function getAllExercisesFromUser(username, from, to, limit) {
  let exercises = [];
  let fromDate;
  let toDate;

  limit = parseInt(limit);

  if (from && to) {
    fromDate = new Date(from);
    toDate = new Date(to);
  }

  if (from && to && limit) {
    exercises = Exercise.find({
      username: username,
      date: {
        $gte: fromDate,
        $lte: toDate
      }
    }).limit(limit);
  } else if (from && to) {
    exercises = Exercise.find({
      username: username,
      date: {
        $gte: fromDate,
        $lte: toDate
      }
    });
  } else if (limit) {
    exercises = Exercise.find({ username: username }).limit(limit);
  } else {
    exercises = Exercise.find({ username: username });
  }

  return exercises;
}

// USER HELPER FUNCTIONS

async function saveUser(user) {
  let userModel = new User(user);
  console.log("Saving user...");

  let newUser = await userModel.save();
  return newUser;
}

async function getUser(userId) {
  let user = await User.findById(userId).exec();
  console.log("user found: ", user);
  return user;
}

async function getAllUsers() {
  let users = User.find({});
  console.log("users", users);
  return users;
}

// SERVER FUNCTIONS

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
