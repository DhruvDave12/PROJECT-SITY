const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: String,
    fileName: String,
});
imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});
const taskSchema = new mongoose.Schema({
    contactNumber: {
        type: Number,
        sparse: true,
    },
    images: [imageSchema],
    address: {
        type:String,
        required: true,
    },
    task: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Userdetail',
    },
    price: {
        type: Number,
    },
    workerName: {
        type: String,
    },
    status: {
        type: String,
    },
    date:{
        type: String,
    }
});

module.exports = mongoose.model('Task', taskSchema);