import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import FeedbackForm from "../models/feedbackFormModel.js";
import FeedbackAnswer from "../models/feedbackAnswerModel.js";

export const createFeedbackForm = async (req, res) => {
  try {
    console.log("Creating feedback form");
    const { eventId } = req.body;
    const { title, questions } = req.body;
    console.log("====================== ========================");
    console.log("Creating feedback form for event:", eventId) , "   ", title, questions;

    const newForm = new FeedbackForm({
      eventId,
      title,
      questions,
    });

    await newForm.save();

    res.status(201).json({ message: "Feedback form created", form: newForm });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFeedbackForm = async (req, res) => {
  try {
    console.log("Fetching feedback form for event:");
    const form = await FeedbackForm.findOne({ eventId: req.params.eventId });

    if (!form) {
      return res.status(404).json({ message: "Feedback form not found" });
    }

    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { formId } = req.params;
    const { respondentId, answers, title } = req.body;

    const newAnswer = new FeedbackAnswer({
      feedbackFormId: formId,
      respondentId,
      answers,
    });
    console.log("Submitting feedback:", title);
    await newAnswer.save();

    res.status(201).json({ message: "Feedback submitted", answer: newAnswer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
