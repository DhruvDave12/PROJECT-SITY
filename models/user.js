const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
       
    },
    address: {
        type: String,
    },
})

// this will automatically add username and password fields into the schema
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);