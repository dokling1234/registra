const mongoose = require("mongoose");

const likertAnswerSchema = new mongoose.Schema({
  statement: String,
  value: Number
});

const answerSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  answer: mongoose.Schema.Types.Mixed,
  answers: [likertAnswerSchema]
 
});

const feedbackAnswerSchema = new mongoose.Schema({
  feedbackFormId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedbackForm", required: true },
  respondentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  answers: [answerSchema],
  submittedAt: { type: Date, default: Date.now },
});

const FeedbackAnswer = mongoose.model("FeedbackAnswer", feedbackAnswerSchema);

module.exports = FeedbackAnswer;