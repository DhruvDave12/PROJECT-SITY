const mongoose = require('mongoose');

const userdetailsSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    address: {
        type: String,
    }
});

module.exports = mongoose.model('Userdetail', userdetailsSchema);