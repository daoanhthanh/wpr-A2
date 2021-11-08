const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const fs = require("fs");

const DATABASE = "wpr-quiz";
const MONGO_DB = `mongodb://localhost:27017/${DATABASE}`;

const app = express();

// serve static files (html, css, js, images...)
app.use(express.static("public"));

// decode req.body from form-data
app.use(express.urlencoded());
// decode req.body from post body message
app.use(express.json());

// application port
const port = 3000;
// number of quizzes on each test
const number_of_questions_to_display = 10;
// init mongoDb collection instances
let questions = null;
// collection for storing attempt
let attempts = null;

let completed = false;

// create data sample
// async function initData() {
//     startedAt = new Date().toISOString();
//     const question = fs.readFileSync("./questions.json");
//     const attempts = JSON.parse(question);

//     await questions.insertMany(attempts);
// }

async function startServer() {
    // Set the db and collection variables before starting the server.
    const client = await mongodb.MongoClient.connect(MONGO_DB);
    questions = client.db().collection("questions");
    attempts = client.db().collection("attempts");

    // initData();

    // Now every route can safely use the db and collection objects.
    await app.listen(port);
    console.log(`May the Node be with you 🚀 ${port}!`);
}

startServer();

// Handle start attempt event
app.post("/attempts", async function(req, res) {
    let response = {};
    let random_question = [];

    let full_data = await questions
        .find({}, {
            projection: {
                correctAnswer: 0, // exclude correct answer field
            },
        })
        .toArray();

    const indices = generateQuestionIndices(
        full_data.length,
        number_of_questions_to_display
    );
    console.log("🚀 ~ file: server.js ~ line 71 ~ app.post ~ indices", indices);

    for (let i of indices) {
        random_question.push(full_data[i]);
    }

    response.questions = random_question;
    response.completed = completed;
    response.score = 0;
    response.startedAt = new Date();
    response.__v = 0;

    const _attempt = await attempts.insertOne(response);

    response._id = _attempt.insertedId;

    res.set({
        "Content-Type": "application/json",
        // ETag: "12345",
    });

    return res.status(201).json(response);
});

/**
 * Handle summit event
 */
app.post("/attempts/:id/submit", async function(req, res) {
    const attempt_id = req.params.id;

    const user_answers = req.body.answers;

    let score = 0;

    const attempt = await attempts.findOne({ _id: mongodb.ObjectId(attempt_id) });
    if (attempt === null) {
        return res.sendStatus(404);
    }

    let question_ids = [];
    for (let i of Object.keys(user_answers)) {
        question_ids.push(mongodb.ObjectId(i));
    }

    let correct_answers = {};
    const data = await questions.find({ _id: { $in: question_ids } }).toArray();
    for (let x of data) {
        correct_answers[x._id] = x.correctAnswer;
    }

    for (let i of question_ids) {
        if (user_answers[i] == correct_answers[i]) {
            score++;
        }
    }

    let response = createSubmitResponse(
        attempt._id,
        attempt.questions,
        score,
        attempt.startedAt,
        correct_answers,
        user_answers
    );

    res.set({
        "Content-Type": "application/json",
        // ETag: "12345",
    });

    return res.status(200).json(response);
});

/**
 *
 * @param {string} _attemptId
 * @param {Object} _attemptQuestions
 * @param {number} _score
 * @param {Date} _startedAt
 * @param {object} _correctAnswers
 * @param {Object} _userAnswers
 * @returns
 */
function createSubmitResponse(
    _attemptId,
    _attemptQuestions,
    _score,
    _startedAt,
    _correctAnswers,
    _userAnswers
) {
    let response = {};
    let _scoreText = "";
    const finalScore = (_score / number_of_questions_to_display) * 10;
    if (finalScore < 5) _scoreText = "Practice more to improve it 😄 ";
    else if (5 <= finalScore && finalScore < 7) {
        _scoreText = "Good, keep up 👍";
    } else if (7 <= finalScore && finalScore < 9) {
        _scoreText = "Well done 👌";
    } else _scoreText = "Perfect 😍";

    response.questions = _attemptQuestions;
    response.completed = true;
    response.score = _score;
    response._id = _attemptId;
    response.correctAnswers = _correctAnswers;

    response.startedAt = _startedAt;
    response.__v = 0;
    response.answers = _userAnswers;
    response.scoreText = _scoreText;

    return response;
}

/**
 * Create random numbers in a range without duplication. Use to generate question indices
 * @param {number} range
 * @param {number} outputQuantity
 * @returns random numbers in {@link range} without duplication
 */
function generateQuestionIndices(range, outputQuantity) {
    let arr = [];
    for (let i = 1; i <= range; i++) {
        arr.push(i);
    }

    let result = [];

    for (let i = 1; i <= outputQuantity; i++) {
        const random = Math.floor(Math.random() * (range - i));
        result.push(arr[random]);
        arr[random] = arr[range - i];
    }

    return result;
}