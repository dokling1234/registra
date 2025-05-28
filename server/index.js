const certificateRoutes = require('./routes/certificateRoutes.js');

// Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/certificate', certificateRoutes); 