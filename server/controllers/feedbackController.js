const userModel = require("../models/userModel.js");
const adminModel = require("../models/adminModel.js");
const FeedbackForm = require("../models/feedbackFormModel.js");
const FeedbackAnswer = require("../models/feedbackAnswerModel.js");
// const openai = require("../config/openaiConfig.js");

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


    // Likert conversion map
    const likertScale = {
      "Very Unsatisfied": 1,
      "Unsatisfied": 2,
      "Neutral": 3,
      "Satisfied": 4,
      "Very Satisfied": 5
    };

    // Convert answers (especially Likert ones)
    const processedAnswers = answers.map((ans) => {
      if (ans.type === "Likert" && Array.isArray(ans.answers)) {
        ans.answers = ans.answers.map((item) => ({
          statement: item.statement,
          value: likertScale[item.value] || Number(item.value) || 0 // Fallback to numeric or 0
        }));
      }
      return ans;
    });

    // Create new feedback answer with the correct structure
    const newAnswer = new FeedbackAnswer({
      feedbackFormId: formId,
      respondentId: userId,
      answers: processedAnswers,
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

const analyzeFeedbackData = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { eventTitle } = req.body;



    // Step 1: Get feedback data
    const feedbackForm = await FeedbackForm.findOne({ eventId });
    if (!feedbackForm) {
      return res.status(404).json({ message: "No feedback form found for this event" });
    }

    const feedbackAnswers = await FeedbackAnswer.find({ 
      feedbackFormId: feedbackForm._id 
    }).populate('respondentId', 'fullName email userType');

    // Step 2: Check if database has data
    if (!feedbackAnswers || feedbackAnswers.length === 0) {
      return res.json({
        success: false,
        message: "No feedback data available for analysis",
        analytics: null
      });
    }

    // Step 3: Extract text responses and remove empty rows
    const textResponses = [];
    feedbackForm.questions.forEach((question, questionIndex) => {
      if (question.type === "Text") {
        feedbackAnswers.forEach(answer => {
          if (answer.answers && answer.answers[questionIndex] && answer.answers[questionIndex].answer) {
            const response = answer.answers[questionIndex].answer.trim();
            if (response && response.length > 0) {
              textResponses.push({
                question: question.text,
                response: response,
                respondentType: answer.respondentId?.userType || 'Unknown'
              });
            }
          }
        });
      }
    });

    // Step 4: Check if we have any text responses
    if (textResponses.length === 0) {
      return res.json({
        success: false,
        message: "No text responses available for analysis",
        analytics: null
      });
    }

    // Step 5: Data cleansing
    const cleanedResponses = textResponses.map(item => ({
      ...item,
      response: item.response
        .trim()
        .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .toLowerCase() // Normalize casing
    })).filter(item => item.response.length > 3); // Remove very short responses

    // Remove duplicates based on response content
    const uniqueResponses = cleanedResponses.filter((item, index, self) => 
      index === self.findIndex(t => t.response === item.response)
    );

    if (uniqueResponses.length === 0) {
      return res.json({
        success: false,
        message: "No valid responses remain after cleansing",
        analytics: null
      });
    }

    // Step 6: Prepare data for ChatGPT analysis
    const responsesText = uniqueResponses.map(item => 
      `Question: ${item.question}\nResponse: ${item.response}\nRespondent Type: ${item.respondentType}`
    ).join('\n\n');

    const prompt = `Analyze the following feedback responses for the event "${eventTitle || 'Event'}". 

Please provide a comprehensive analysis including:

1. **Key Themes**: Identify the main themes and topics mentioned in the responses
2. **Keywords**: Extract the most frequently mentioned keywords and phrases
3. **Sentiment Analysis**: Overall sentiment (positive, negative, neutral, or mixed)
4. **Insights**: Key insights and actionable recommendations
5. **Response Quality**: Assessment of response quality and engagement

Feedback Responses:
${responsesText}

Please format your response as JSON with the following structure:
{
  "keyThemes": ["theme1", "theme2", "theme3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sentiment": "positive/negative/neutral/mixed",
  "sentimentScore": 0.8,
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "responseQuality": "high/medium/low",
  "summary": "Brief summary of the analysis"
}`;

    // Step 7: Mock analytics response (temporary for testing)
    const mockAnalytics = {
      keyThemes: ["Event Quality", "Speaker Performance", "Content Relevance"],
      keywords: ["excellent", "informative", "well-organized", "engaging"],
      sentiment: "positive",
      sentimentScore: 0.8,
      insights: [
        "Participants found the event highly informative and well-organized",
        "Speaker performance was rated positively by attendees",
        "Content was relevant and engaging for the target audience"
      ],
      recommendations: [
        "Consider hosting similar events in the future",
        "Maintain the current level of organization and preparation",
        "Continue with the same speaker selection criteria"
      ],
      responseQuality: "high",
      summary: "Overall positive feedback with high engagement and satisfaction levels",
      metadata: {
        totalResponses: feedbackAnswers.length,
        textResponses: uniqueResponses.length,
        analysisDate: new Date().toISOString(),
        eventTitle: eventTitle || 'Event'
      }
    };

    res.json({
      success: true,
      analytics: mockAnalytics,
      rawResponses: uniqueResponses
    });

  } catch (err) {
    console.error("Error analyzing feedback data:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
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
  analyzeFeedbackData,
};
