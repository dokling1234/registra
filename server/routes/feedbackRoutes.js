const express = require('express');
const { getFeedbackForm, createFeedbackForm, submitFeedback, checkSubmission, mobileSubmitFeedback, mobileCheckSubmission } = require('../controllers/feedbackController.js');
const userAuth = require('../middleware/userAuth.js');

const feedbackRoutes = express.Router();

feedbackRoutes.get('/getFeedback/:eventId', getFeedbackForm);
feedbackRoutes.put('/createFeedback', createFeedbackForm);
feedbackRoutes.post('/submitFeedback/:formId',userAuth, submitFeedback);
feedbackRoutes.get('/checkSubmission/:eventId', userAuth, checkSubmission);


const mobileFeedbackRoutes = express.Router();

mobileFeedbackRoutes.post('/submitFeedback/:formId', mobileSubmitFeedback);
mobileFeedbackRoutes.get('/checkSubmission', mobileCheckSubmission);



module.exports = {
  feedbackRoutes,
  mobileFeedbackRoutes
};