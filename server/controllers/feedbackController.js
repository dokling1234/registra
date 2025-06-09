const userModel = require("../models/userModel.js");
const adminModel = require("../models/adminModel.js");
const FeedbackForm = require("../models/feedbackFormModel.js");
const FeedbackAnswer = require("../models/feedbackAnswerModel.js");

const createFeedbackForm = async (req, res) => {
  try {
    const { eventId, title, questions, date } = req.body; // <-- Accept date
    console.log(
      "Creating/updating feedback form for event:",
      eventId,
      title,
      questions,
      date
    );

    const processedQuestions = questions.map((q) => {
      if (q.type === "Likert") {
        return {
          ...q,
          options:
            q.likertOptions && Array.isArray(q.likertOptions)
              ? q.likertOptions
              : [
                  "Very Unsatisfied",
                  "Unsatisfied",
                  "Neutral",
                  "Satisfied",
                  "Very Satisfied",
                ],
        };
      }
      return q;
    });

    const updatedForm = await FeedbackForm.findOneAndUpdate(
      { eventId },
      { eventId, title, questions: processedQuestions, date }, // <-- Save date
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Feedback form saved", form: updatedForm });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFeedbackForm = async (req, res) => {
  const { eventId } = req.params;
  try {
    const form = await FeedbackForm.findOne({ eventId });

    if (!form) {
      return res.status(404).json({ message: "Feedback form not found" });
    }

    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const submitFeedback = async (req, res) => {
  console.log("submmitFeedback");
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    const { userId } = req.user;
    // Create new feedback answer with the correct structure
    const newAnswer = new FeedbackAnswer({
      feedbackFormId: formId,
      respondentId: userId, // Use userId from auth middleware
      answers,
      submittedAt: new Date(),
    });

    console.log("Submitting feedback:", {
      feedbackFormId: formId,
      respondentId: userId,
      answersCount: answers.length,
    });

    await newAnswer.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      answer: newAnswer,
    });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const checkSubmission = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.user;
    console.log(eventId);
    console.log(userId);

    // First find the feedback form for this event
    const feedbackForm = await FeedbackForm.findOne({ eventId });
    if (!feedbackForm) {
      return res.json({ hasSubmitted: false });
    }

    // Check if there's a submission in the FeedbackAnswer collection
    const submission = await FeedbackAnswer.findOne({
      feedbackFormId: feedbackForm._id,
      respondentId: userId,
    });

    console.log("Checking submission:", {
      feedbackFormId: feedbackForm._id,
      respondentId: userId,
      found: !!submission,
      submission: submission
        ? {
            _id: submission._id,
            submittedAt: submission.submittedAt,
            answersCount: submission.answers.length,
          }
        : null,
    });

    res.json({
      hasSubmitted: !!submission,
      submissionId: submission?._id,
    });
  } catch (err) {
    console.error("Error checking feedback submission:", err);
    res.status(500).json({ error: err.message });
  }
};

const mobileSubmitFeedback = async (req, res) => {
  try {
    console.log("Mobile feedback submission request received");
    const { formId } = req.params;
    const { answers, userId } = req.body;
    console.log("Mobile feedback submission data:", {
      formId,
      userId,
      answersCount: answers.length,
    });

    // Create new feedback answer with the correct structure
    const newAnswer = new FeedbackAnswer({
      feedbackFormId: formId,
      respondentId: userId,
      answers,
      submittedAt: new Date(),
    });

    console.log("Submitting mobile feedback:", {
      feedbackFormId: formId,
      respondentId: userId,
      answersCount: answers.length,
    });

    await newAnswer.save();

    res.status(201).json({
      success: true,
      message: "Mobile feedback submitted successfully",
      answer: newAnswer,
    });
  } catch (err) {
    console.error("Error submitting mobile feedback:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const mobileCheckSubmission = async (req, res) => {
  try {
    console.log("Mobile submission check request received");
    const { eventId, userId } = req.query;
    console.log(
      "Checking mobile submission for event:",
      eventId,
      "by user:",
      userId
    );
    // First find the feedback form for this event
    const feedbackForm = await FeedbackForm.findOne({ eventId });
    if (!feedbackForm) {
      return res.json({ hasSubmitted: false });
    }

    // Check if there's a submission in the FeedbackAnswer collection
    const submission = await FeedbackAnswer.findOne({
      feedbackFormId: feedbackForm._id,
      respondentId: userId,
    });

    console.log("Checking submission:", {
      feedbackFormId: feedbackForm._id,
      respondentId: userId,
      found: !!submission,
      submission: submission
        ? {
            _id: submission._id,
            submittedAt: submission.submittedAt,
            answersCount: submission.answers.length,
          }
        : null,
    });

    res.json({
      hasSubmitted: !!submission,
      submissionId: submission?._id,
    });
  } catch (err) {
    console.error("Error checking feedback submission:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createFeedbackForm,
  getFeedbackForm,
  submitFeedback,
  checkSubmission,
  mobileSubmitFeedback,
  mobileCheckSubmission,
};
