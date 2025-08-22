const express = require('express');
const { getFeedbackForm, createFeedbackForm, submitFeedback, checkSubmission, mobileSubmitFeedback, mobileCheckSubmission, getEventFeedbackData, analyzeFeedbackData } = require('../controllers/feedbackController.js');
const userAuth = require('../middleware/userAuth.js');

const feedbackRoutes = express.Router();

feedbackRoutes.get('/getFeedback/:eventId', getFeedbackForm); //eventId
feedbackRoutes.put('/createFeedback', createFeedbackForm);
feedbackRoutes.post('/submitFeedback/:formId',userAuth, submitFeedback); // formId
feedbackRoutes.get('/checkSubmission/:eventId', userAuth, checkSubmission);//eventId
feedbackRoutes.get('/getEventFeedbackData/:eventId', getEventFeedbackData); //eventId
feedbackRoutes.post('/analyzeFeedback/:eventId', analyzeFeedbackData); //eventId


const mobileFeedbackRoutes = express.Router();

mobileFeedbackRoutes.post('/submitFeedback/:formId', mobileSubmitFeedback); //formId
mobileFeedbackRoutes.get('/checkSubmission', mobileCheckSubmission);



module.exports = {
  feedbackRoutes,
  mobileFeedbackRoutes
};