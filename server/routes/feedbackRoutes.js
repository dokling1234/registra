import express from 'express';
import { getFeedbackForm, createFeedbackForm, submitFeedback} from '../controllers/feedbackController.js';
const feedbackRoutes = express.Router();

feedbackRoutes.get('/getFeedback/:eventId', getFeedbackForm);
feedbackRoutes.put('/createFeedback', createFeedbackForm); 
feedbackRoutes.post('/submitFeedback/:formId', submitFeedback); 


export default feedbackRoutes;