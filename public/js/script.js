const _confirm = document.getElementById("confirm");
const quiz_body = document.querySelector(".quiz-body");
document
    .getElementById("btn-cancel")
    .addEventListener("click", cancelSubmitting);

let count = 1;
let qName = 0;
let userAnswers = {};
let id = null;
// const API = "https://wpr-quiz-api.herokuapp.com/attempts";
// const API = "http://localhost:3000/attempts";

function main() {
    const start_button = document.querySelector("#start_button");
    start_button.addEventListener("click", handleStartButton);
}
main();

async function handleStartButton() {
    const intro = document.querySelector("#introduction");
    intro.style.display = `none`;
    generateQuestions();
}

async function fetchData(submitId, answer) {
    // let url = "https://wpr-quiz-api.herokuapp.com/attempts";
    let url = "http://localhost:3000/attempts";
    const defaultParams = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },

        mode: "no-cors",
    };
    if (answer) {
        defaultParams.body = JSON.stringify({
            answers: userAnswers,
        });
        console.log(
            "🚀 ~ file: script.js ~ line 41 ~ fetchData ~ defaultParams.body",
            defaultParams.body
        );
    }
    if (submitId) {
        // url = `https://wpr-quiz-api.herokuapp.com/attempts/${submitId}/submit`;
        url = `http://localhost:3000/attempts/${submitId}/submit`;
        console.log(
            "🚀 ~ file: script.js ~ line 49 ~ fetchData ~ submitId",
            submitId
        );
    }
    const myResponse = await fetch(url, defaultParams);
    const myJson = await myResponse.json();
    console.log("🚀 ~ file: script.js ~ line 52 ~ fetchData ~ myJson", myJson);
    return myJson;
}

async function generateQuestions() {
    const data = await fetchData();
    id = data._id;
    const button_submit = document.createElement("button");
    const button_div = document.createElement("div");

    data.questions.forEach((input_question) => {
        quiz_body.appendChild(
            createQuestion(data.questions.length, input_question)
        );
        count++;
    });
    button_submit.textContent = "Submit your answers >";
    button_submit.classList.add("green");
    button_submit.addEventListener("click", handleSubmitButton);
    button_div.classList.add("box");
    button_div.setAttribute("id", "submit-div");
    button_div.appendChild(button_submit);
    quiz_body.appendChild(button_div);
}

function createQuestion(input_qlength, input_question) {
    const question_box = document.createElement("div");
    const title = document.createElement("p");
    const question = document.createElement("p");
    const answer_box = document.createElement("div");

    question_box.classList.add("question_box");
    answer_box.classList.add("answer_box");

    title.classList.add("title");
    title.classList.add("with-margin");
    title.textContent = `Question ${count} of ${input_qlength}`;

    question.classList.add("questions");
    question.classList.add("with-margin");
    question.textContent = `${input_question.text}`;

    for (let i = 0; i < input_question.answers.length; i++) {
        answer_box.appendChild(createAnswer(input_question, i));
    }

    question_box.appendChild(title);
    question_box.appendChild(question);
    question_box.appendChild(answer_box);

    return question_box;
}

function createAnswer(input_question, index) {
    userAnswers[input_question._id] = null;
    const label = document.createElement("label");
    const input = document.createElement("input");
    const div = document.createElement("div");
    const span = document.createElement("span");

    input.type = "radio";
    input.id = `Q${qName}`;
    input.name = `${input_question._id}`;
    input.value = `${index}`;
    input.addEventListener("click", handleAnsClick);

    span.classList.add("answer_container");
    span.textContent = input_question.answers[index];
    label.htmlFor = `Q${qName}`;
    label.appendChild(span);
    div.classList.add("background");
    div.appendChild(input);
    div.appendChild(label);
    qName++;
    return div;
}

function handleAnsClick(e) {
    userAnswers[e.target.name] = e.target.value;
}

function handleSubmitButton() {
    document.body.classList.add("no-scroll");
    _confirm.style.top = window.pageYOffset + "px";
    _confirm.classList.remove("hidden");

    document.getElementById("btn-yes").addEventListener("click", generateResult);
}

function cancelSubmitting() {
    quiz_body.scrollIntoView();
    document.body.classList.remove("no-scroll");
    _confirm.classList.add("hidden");
}

async function generateResult() {
    //hide submission button
    const button_div = document.querySelector("#submit-div");
    button_div.style.display = "none";
    //generate result
    quiz_body.scrollIntoView();
    document.body.classList.remove("no-scroll");
    _confirm.classList.add("hidden");
    const data = await fetchData(id, userAnswers);
    const disable = document.querySelectorAll("input");
    const review_quiz = document.querySelector("#review-quiz");

    disable.forEach((e) => {
        e.disabled = true;
    });

    for (const key in userAnswers) {
        checkAns(key, data.correctAnswers);
    }

    review_quiz.appendChild(createResultView(data.score, data.scoreText));
}

function checkAns(key, correctAns) {
    const totalInputDom = document.querySelectorAll(`input[name='${key}']`);
    const userInputDom = totalInputDom[userAnswers[key]];
    const correctInputDOM = totalInputDom[correctAns[key]];
    const statusCorrect = document.createElement("div");
    const statusWrong = document.createElement("div");
    statusCorrect.textContent = "Correct Answer";
    statusCorrect.classList.add("correct");
    statusWrong.textContent = "Your Answer";
    statusWrong.classList.add("wrong");
    //if user chose an answer
    if (userAnswers[key] != null) {
        //if user answer is correct
        if (userAnswers[key] == correctAns[key]) {
            correctInputDOM.nextElementSibling.style.backgroundColor = "#d4edda";
            correctInputDOM.nextElementSibling.appendChild(statusCorrect);
        }
        //if user answer is wrong
        else {
            correctInputDOM.nextElementSibling.style.backgroundColor = "#ddd";
            userInputDom.nextElementSibling.style.backgroundColor = "#f8d7da";
            correctInputDOM.nextElementSibling.appendChild(statusCorrect);
            userInputDom.nextElementSibling.appendChild(statusWrong);
        }
    }
    //if user did not choose an answer
    else {
        correctInputDOM.nextElementSibling.style.backgroundColor = "#ddd";
        correctInputDOM.nextElementSibling.appendChild(statusCorrect);
    }
}

function createResultView(score, comment) {
    const result_box = document.createElement("div");
    const titles = document.createElement("p");
    const result_score = document.createElement("p");
    const result_percent = document.createElement("p");
    const result_comment = document.createElement("p");
    const button_again = document.createElement("button");

    result_box.classList.add("box");
    titles.classList.add("result_title", "with-margin");
    titles.textContent = "Result:";
    result_score.classList.add("score", "with-margin");
    result_score.textContent = `${score}/10`;
    result_percent.classList.add("questions", "with-margin");
    result_percent.textContent = `${score * 10}%`;
    result_comment.classList.add("with-margin");
    result_comment.textContent = comment;
    button_again.textContent = "Try Again";
    button_again.classList.add("blue");
    button_again.addEventListener("click", handleTryAgainButton);
    result_box.appendChild(titles);
    result_box.appendChild(result_score);
    result_box.appendChild(result_percent);
    result_box.appendChild(result_comment);
    result_box.appendChild(button_again);

    return result_box;
}

function handleTryAgainButton() {
    location.reload();
}