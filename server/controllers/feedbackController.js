const userModel = require("../models/userModel.js");
const adminModel = require("../models/adminModel.js");
const FeedbackForm = require("../models/feedbackFormModel.js");
const FeedbackAnswer = require("../models/feedbackAnswerModel.js");

const createFeedbackForm = async (req, res) => {
  try {
    const { eventId, title, questions, date } = req.body; // <-- Accept date

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
    const { formId } = req.params;
    const { answers, userId } = req.body;

    // Create new feedback answer with the correct structure
    const newAnswer = new FeedbackAnswer({
      feedbackFormId: formId,
      respondentId: userId,
      answers,
      submittedAt: new Date(),
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
    const { eventId, userId } = req.query;

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

    res.json({
      hasSubmitted: !!submission,
      submissionId: submission?._id,
    });
  } catch (err) {
    console.error("Error checking feedback submission:", err);
    res.status(500).json({ error: err.message });
  }
};

const getEventFeedbackData = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find the feedback form for this event
    const feedbackForm = await FeedbackForm.findOne({ eventId });
    if (!feedbackForm) {
      return res.status(404).json({ message: "No feedback form found for this event" });
    }

    // Find all feedback answers for this form
    const feedbackAnswers = await FeedbackAnswer.find({ 
      feedbackFormId: feedbackForm._id 
    }).populate('respondentId', 'fullName email userType');

    res.json({
      form: feedbackForm,
      answers: feedbackAnswers,
      totalResponses: feedbackAnswers.length
    });
  } catch (err) {
    console.error("Error fetching event feedback data:", err);
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
  getEventFeedbackData,
};
