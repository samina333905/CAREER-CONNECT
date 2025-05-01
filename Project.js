const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a project title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a project description'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    technologies: [{
        type: String,
        trim: true
    }],
    startDate: {
        type: Date,
        required: [true, 'Please add a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please add an end date']
    },
    projectFile: {
        path: {
            type: String,
            required: [true, 'Project file path is required']
        },
        originalName: {
            type: String,
            required: [true, 'Original file name is required']
        },
        mimeType: {
            type: String,
            required: [true, 'File type is required']
        },
        size: {
            type: Number,
            required: [true, 'File size is required']
        }
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    jobSeeker: {
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
ProjectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Validate that endDate is after startDate
ProjectSchema.pre('save', function(next) {
    if (this.endDate < this.startDate) {
        next(new Error('End date must be after start date'));
    } else {
        next();
    }
});

// Validate file size (max 5MB)
ProjectSchema.pre('save', function(next) {
    if (this.projectFile.size > 5 * 1024 * 1024) {
        next(new Error('File size cannot exceed 5MB'));
    } else {
        next();
    }
});

// Validate file types
ProjectSchema.pre('save', function(next) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(this.projectFile.mimeType)) {
        next(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    } else {
        next();
    }
});

// Create indexes for better query performance
ProjectSchema.index({ title: 'text', description: 'text' });
ProjectSchema.index({ user: 1, createdAt: -1 });
ProjectSchema.index({ jobSeeker: 1, status: 1 });

module.exports = mongoose.model('Project', ProjectSchema); 