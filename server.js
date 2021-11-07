const express = require("express");
const mongodb = require("mongodb");

const DATABASE = "quiz";
const MONGO_DB = `mongodb://localhost:27017/${DATABASE}`;

const app = express();

// serve static files (html, css, js, images...)
app.use(express.static("public"));

// decode req.body from form-data
app.use(express.urlencoded());
// decode req.body from post body message
app.use(express.json());

// application port
const port = 300;
// prepare data
const question_list = require("./question_list.js");
// init mongoDb collection instance
let collection = null;
// collection for storing attempt
let j = null;
// time when user start an attempt
let startedAt;
let completed = false;

// create data sample
async function initData() {
    startedAt = new Date().toISOString();
    let createQuestion = await questions.insertMany(list_questions);
    create_questions = createQuestion["ops"];
}

async function startServer() {
    // Set the db and collection variables before starting the server.
    const client = await mongodb.MongoClient.connect(MONGO_DB);
    collection = client.db().collection("test");
    // Now every route can safely use the db and collection objects.
    await app.listen(port);
    console.log(`May the Node be with you ${port}!`);

    // const results = await collection.find().toArray();
    // for (const result of results) {
    //     console.log(`Word: ${result.word}, definition: ${result.definition}`);
    //     console.log(results);
    // }
}

startServer();