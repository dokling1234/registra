const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Choice", "Text", "Rating", "Likert"],
    required: true,
  },
  text: { type: String },
  options: [String],
  statements: [String],
  scale: { type: Number },
});

const feedbackFormSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  title: { type: String, default: "Event Feedback" },
  questions: [questionSchema],
  date: { type: Date }, // <-- Add this line
  createdAt: { type: Date, default: Date.now },
});

const FeedbackForm = mongoose.model("FeedbackForm", feedbackFormSchema);

module.exports = FeedbackForm;
