const mongoose = require('mongoose');

const connection = mongoose.createConnection(
    'mongodb+srv://ashikirobatumbakers:matthewadami@registradatabase.1uei8.mongodb.net/test',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

connection.on('open', () => {
    console.log('MongoDB Connected');
});

connection.on('error', (err) => {
    console.error('MongoDB Connection Error:', err);
});

module.exports = connection;