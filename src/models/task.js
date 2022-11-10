const mongoose = require('mongoose');

const structure = {
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectID,
        required: true,
        ref: 'User'
    }
};

const taskFields = Object.keys(structure);
const taskSchema = new mongoose.Schema(structure, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task, taskFields };