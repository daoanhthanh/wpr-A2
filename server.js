const express = require("express");
const mongodb = require("mongodb");
//const { rawListeners } = require('process');
//const bodyParser = require('body-parser');

const DATABASE_NAME = "daoanhthanh-wpr-quiz";
const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;

const app = express();

//after middleware to solve undefined req.body
app.use(express.static("public"));

// decode req.body from form-data
app.use(express.urlencoded({ extended: true }));
// decode req.body from post body message
app.use(express.json());

const list_questions = require("./questions.js");
let db = null;
let attempts = null;
let results = null;

let correctAnswers = {};
let cor_answers = {};
let score = 0;
let started_at;

let your_choice = {};
let wrong_choice = {};
let correct_choice = {};

let selected_answers = {};

let ques = {};
let questions;
let attempt_questions = [];
let attempt_questions_2 = [];
let index = {};

let random_ques = [];

let id;
let content_quiz;
let selectedAnswers = null;

let temp_selected_answers = {};

//create doc question in dbs
async function createDocument() {
    started_at = new Date().toISOString();
    let createQuestion = await questions.insertMany(list_questions);
    create_questions = createQuestion["ops"];
    console.log(
        "🚀 ~ file: server.js ~ line 54 ~ createDocument ~ create_questions",
        create_questions
    );
}

//get new attempt if the previous attempt was completed
app.get("/attempts", startQuiz);
async function startQuiz(req, res) {
    temp_selected_answers = {};
    let len = Object.keys(create_questions).length;
    let i = 0;
    let j = 0;
    random_ques = [];
    attempt_questions = [];
    attempt_questions_2 = [];
    //create random list of questions
    while (i < len) {
        j = Math.floor(Math.random() * len);
        if (random_ques.includes(j)) {
            continue;
        }
        random_ques.push(j);
        i++;
    }

    for (i of random_ques) {
        attempt_questions.push(create_questions[i]);
    }
    attempt_questions_2 = attempt_questions.map((obj) => ({...obj }));
    correctAnswers = {};

    for (let i = 0; i < attempt_questions.length; i++) {
        let question_id = attempt_questions[i]._id;

        correctAnswers[question_id] = attempt_questions[i].correctAnswer;

        delete attempt_questions_2[i].correctAnswer;
    }
    content_quiz = null;
    content_quiz = await attempts.insertOne({
        questions: attempt_questions,
        completed: false,
        score: score,
        correctAnswers: correctAnswers,
        selectedAnswers: selectedAnswers,
        startedAt: started_at,
    });

    id = content_quiz["ops"][0]._id;
    index["id"] = id;

    //only response list of questions and index of attempt
    res.send({
        attempt_questions_2,
        index,
    });
}
let scoreText;

//submit and check answers
app.post("/:id/submit", checkAnswer);
async function checkAnswer(req, res) {
    score = 0;

    let quiz_id = req.params.id;

    selected_answers = req.body.selected_answers;
    your_choice = {};
    wrong_choice = {};
    correct_choice = {};

    const doc = await attempts.findOne({ _id: mongodb.ObjectId(quiz_id) });
    if (doc === null) {
        res.send(404).end();
    }

    correctAnswers = doc.correctAnswers;

    //create a temp dictionary cor_answers containing all correct answers
    for (let correct_ans in correctAnswers) {
        cor_answers[correct_ans] = correctAnswers[correct_ans];
    }

    for (let ans in selected_answers) {
        for (let correct_ans in correctAnswers) {
            //check answers, save all correct selected choices in your_choice
            //save wrong choices in wrong_choice
            //save unselected choices in correct_choice
            if (ans == correct_ans) {
                if (selected_answers[ans] == correctAnswers[correct_ans]) {
                    score++;
                    your_choice[ans] = selected_answers[ans];
                } else {
                    wrong_choice[ans] = selected_answers[ans];
                    correct_choice[ans] = correctAnswers[correct_ans];
                }
            }
        }
        //delete correct answers used to check in cor_answer
        delete cor_answers[ans];
    }
    //add all left correct answers in cor_answer to correct_choice
    for (let ans in cor_answers) {
        if (ans !== null) {
            correct_choice[ans] = cor_answers[ans];
        }
    }
    if (score < 5) {
        scoreText = "Practice more to improve it :D";
    } else if (5 <= score <= 7) {
        scoreText = "Good, keep up!";
    } else if (7 <= score < 9) {
        scoreText = "Well done!";
    } else if (9 <= score <= 10) {
        scoreText = "Perfect!";
    }

    let result = await results.insertOne({
        questions: attempt_questions,
        completed: true,
        score: score,
        correctAnswers: correctAnswers,
        startedAt: started_at,
        selectedAnswers: selected_answers,
        scoreText: scoreText,
    });
    res.json(result["ops"]);
}

app.get("/result", obtainResult);

async function obtainResult(req, res) {
    res.send({
        attempt_questions,
        selected_answers,
        your_choice,
        wrong_choice,
        correct_choice,
        score,
        scoreText,
    });
}

//get uncompleted attempt by id saved in local storage
app.get("/attempts/:id", getExistingAttempt);
async function getExistingAttempt(req, res) {
    const exist_attempt_id = req.params.id;
    //based on id, find doc exists in attempts
    const doc = await attempts.findOne({
        _id: mongodb.ObjectId(exist_attempt_id),
    });
    temp_selected_answers = {};

    //find selected answers and correct answers of the attempts
    temp_selected_answers = doc.selectedAnswers;
    attempt_questions = doc.questions;
    attempt_questions_2 = attempt_questions.map((obj) => ({...obj }));
    for (let i = 0; i < attempt_questions.length; i++) {
        let question_id = attempt_questions[i]._id;
        correctAnswers[question_id] = attempt_questions[i].correctAnswer;

        delete attempt_questions_2[i].correctAnswer;
    }
    //response questions, id of attempt and all selected choice of the previous attempt
    res.status(200).send({
        attempt_questions_2,
        exist_attempt_id,
        temp_selected_answers,
    });
}

//update the attempt by saving all selected choice in the corresponding attempt
app.patch("/attempts/:id", saveUserAnswers);

async function saveUserAnswers(req, res) {
    let temp_attempt_id = req.params.id;
    selectedAnswers = req.body.temp_selected_answer;
    if (selectedAnswers != null) {
        for (let id_qn in selectedAnswers) {
            temp_selected_answers[id_qn] = selectedAnswers[id_qn];
        }
    }

    const query = { _id: mongodb.ObjectId(temp_attempt_id) };
    const newEntry = {
        questions: attempt_questions,
        completed: false,
        score: 0,
        correctAnswers: correctAnswers,
        startedAt: started_at,
        selectedAnswers: temp_selected_answers,
        scoreText: null,
    };

    const params = { upsert: true };
    const response = await attempts.update(query, newEntry, params);
    res.status(200).end();
}

async function startServer() {
    const client = await mongodb.MongoClient.connect(MONGO_URL);
    db = client.db();
    attempts = db.collection("attempts");
    results = db.collection("results");
    questions = db.collection("questions");

    createDocument();
    console.log("Connected to db");

    await app.listen(3000);
    console.log("Listening to port 3000");
}

startServer();