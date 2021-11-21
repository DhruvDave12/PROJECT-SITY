const mongoose = require('mongoose');


const workerDetailsSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    address: {
        type: String,
    },
    email: {
        type: String,
    },
    typeOfWork: {
        type: String,
    },
    contact: {
        type: Number,
    }
});


module.exports = mongoose.model('Workerdetails', workerDetailsSchema);