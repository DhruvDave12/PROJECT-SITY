const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');


const workerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        required: true
    },
    typeOfWork: {
        type: String,
        required: true,
    },
});



// this will automatically add username and password fields into the schema
workerSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Worker', workerSchema);