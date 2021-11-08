const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const fs = require("fs");

const DATABASE = "wpr-quiz";
const MONGO_DB = `mongodb://localhost:27017/${DATABASE}`;

const app = express();

let client;

// serve static files (html, css, js, images...)
app.use(express.static("public"));

// decode req.body from form-data
app.use(express.urlencoded());
// decode req.body from post body message
app.use(express.json());

// application port
const port = 3000;
// prepare data
// init mongoDb collection instances
let questions = null;
// collection for storing attempt
let attempts = null;
// time when user start an attempt
let startedAt;
// stores user answers temporarily
let user_answer = {};
// store questions data
// let question_data;

let completed = false;
let _startedAt;

// create data sample
// async function initData() {
//     startedAt = new Date().toISOString();
//     const question = fs.readFileSync("./questions.json");
//     const docs = JSON.parse(question);

//     let data_temp = await questions.insertMany(docs);
//     question_data = data_temp.ops;
// }

async function startServer() {
    // Set the db and collection variables before starting the server.
    client = await mongodb.MongoClient.connect(MONGO_DB);
    questions = client.db().collection("questions");
    attempts = client.db().collection("attempts");
    _startedAt = new Date();

    // initData();

    // Now every route can safely use the db and collection objects.
    await app.listen(port);
    console.log(`May the Node be with you ⚔ ${port}!`);
}

startServer();

// Handle start attempt event
app.post("/attempts", startAttempt);
async function startAttempt(req, res) {
    let response = {};
    let random_question = [];
    const number_of_questions = 10;

    let full_data = await questions
        .find({}, {
            projection: {
                correctAnswer: 0, // exclude correct answer field
            },
        })
        .toArray();

    for (let i = 0; i < 2; i++) {
        let random_number = Math.floor(Math.random() * number_of_questions);
        random_question.push(full_data[random_number]);
    }

    response.questions = random_question;
    response.completed = completed; //test
    response.score = 0; //test
    response._id = "5f6d6ca8f460e14320ad56f9"; //test
    response.startedAt = _startedAt;
    response.__v = 0; //test

    res.set({
        "Content-Type": "application/json",
        // ETag: "12345",
    });

    return res.json(response);
}