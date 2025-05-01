const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: [{
        type: String
    }],
    responsibilities: [{
        type: String
    }],
    salary: {
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    skills: [{
        type: String
    }],
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true
    },
    applications: [{
        jobSeeker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobSeeker'
        },
        status: {
            type: String,
            enum: ['Pending', 'Shortlisted', 'Rejected', 'Hired'],
            default: 'Pending'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
JobSchema.index({ title: 'text', description: 'text', location: 'text' });
JobSchema.index({ employer: 1, createdAt: -1 });

module.exports = mongoose.model('Job', JobSchema); 