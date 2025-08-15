const userModel = require("../models/userModel.js");
const adminModel = require("../models/adminModel.js");
const FeedbackForm = require("../models/feedbackFormModel.js");
const FeedbackAnswer = require("../models/feedbackAnswerModel.js");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

    // 1. Find the feedback form for this event
    const feedbackForm = await FeedbackForm.findOne({ eventId });
    if (!feedbackForm) {
      return res.status(404).json({ message: "No feedback form found for this event" });
    }

    // 2. Find all feedback answers for this form
    const feedbackAnswers = await FeedbackAnswer.find({
      feedbackFormId: feedbackForm._id
    }).populate("respondentId", "fullName email userType");

    // 3. Group open-ended answers by questionText
    const groupedFeedback = {};
    feedbackAnswers.forEach(doc => {
      if (Array.isArray(doc.answers)) {
        doc.answers.forEach(ans => {
          if (typeof ans.answer === "string" && ans.answer.trim()) {
            if (!groupedFeedback[ans.questionText]) {
              groupedFeedback[ans.questionText] = [];
            }
            groupedFeedback[ans.questionText].push(ans.answer.trim());
          }
        });
      }
    });

    // 4. Summarize each question's answers
    const summaries = {};
    for (const [question, feedbackList] of Object.entries(groupedFeedback)) {
      const cleaned = [...new Set(
        feedbackList.map(f =>
          f.replace(/[^a-zA-Z0-9\s.,!?]/g, "")
           .replace(/\s+/g, " ")
           .trim()
        )
      )];

      const bulletList = cleaned.map(f => `- ${f}`).join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an assistant that summarizes open-ended survey answers."
          },
          {
            role: "user",
            content: `Question: ${question}\nFeedback:\n${bulletList}\n\nSummarize key themes, keywords, and sentiment in bullet points.`
          }
        ],
        temperature: 0.3
      });

      summaries[question] = completion.choices[0].message.content;
    }

    // 5. Return everything together
    res.json({
      form: feedbackForm,
      answers: feedbackAnswers,
      totalResponses: feedbackAnswers.length,
      summaries
    });

  } catch (err) {
    console.error("Error fetching event feedback data:", err);
    res.status(500).json({ error: err.message });
  }
};

// const analyzeFeedback = async (req, res) => {
//   try {
//     const { formId } = req.params;

//     if (!formId) {
//       return res.status(400).json({ error: "feedbackFormId is required in URL params." });
//     }

//     // Step 1: Fetch feedback for this formId
//     const docs = await FeedbackAnswer.find({ feedbackFormId: formId }).lean();

//     if (!docs || docs.length === 0) {
//       return res.status(404).json({ error: "No feedback found for this form." });
//     }

//     // Step 2: Extract text answers from nested answers[]
//     let rawData = [];
//     docs.forEach(doc => {
//       if (Array.isArray(doc.answers)) {
//         doc.answers.forEach(ans => {
//           if (typeof ans.answer === "string" && ans.answer.trim()) {
//             rawData.push({ feedback: ans.answer });
//           }
//         });
//       }
//     });

//     if (rawData.length === 0) {
//       return res.status(400).json({ error: "No open-ended text feedback found." });
//     }

//     // Step 3: Cleansing
//     let cleaned = rawData.map(row => {
//       let feedback = row.feedback
//         .trim()
//         .replace(/[^a-zA-Z0-9\s.,!?]/g, "")
//         .replace(/\s+/g, " ");
//       feedback =
//         feedback.charAt(0).toUpperCase() + feedback.slice(1).toLowerCase();
//       return { feedback };
//     });

//     // Remove duplicates
//     cleaned = cleaned.filter(
//       (row, idx, self) => idx === self.findIndex(r => r.feedback === row.feedback)
//     );

//     if (cleaned.length === 0) {
//       return res.status(400).json({ error: "No data after cleansing." });
//     }

//     // Step 4: Join into bullet list
//     const feedbackText = cleaned.map(r => `- ${r.feedback}`).join("\n");

//     // Step 5: Send to GPT for summarization
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: "You are an assistant that analyzes open-ended survey feedback."
//         },
//         {
//           role: "user",
//           content: `Here is the feedback data:\n${feedbackText}\n\nPlease summarize key themes, extract common keywords, and provide sentiment analysis in bullet points.`
//         }
//       ],
//       temperature: 0.3
//     });

//     res.json({
//       summary: completion.choices[0].message.content
//     });
//     console.log("Feedback analysis completed successfully.", completion.choices[0].message.content);
//   } catch (err) {
//     console.error("Error analyzing feedback:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

module.exports = {
  createFeedbackForm,
  getFeedbackForm,
  submitFeedback,
  checkSubmission,
  mobileSubmitFeedback,
  mobileCheckSubmission,
  getEventFeedbackData,
  analyzeFeedback,
};
