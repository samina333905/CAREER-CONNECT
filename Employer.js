const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    companyName: {
        type: String,
        required: [true, 'Please add a company name'],
        trim: true
    },
    companyDescription: {
        type: String,
        required: [true, 'Please add a company description']
    },
    companyWebsite: {
        type: String,
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS'
        ]
    },
    companyLogo: {
        type: String
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    industry: {
        type: String,
        required: [true, 'Please add an industry']
    },
    location: {
        address: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    contactPerson: {
        name: String,
        position: String,
        email: String,
        phone: String
    },
    socialMedia: {
        linkedin: String,
        twitter: String,
        facebook: String
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verificationDocuments: [{
        documentType: String,
        documentUrl: String,
        uploadedAt: Date
    }],
    subscription: {
        type: {
            type: String,
            enum: ['free', 'basic', 'premium'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        features: [String]
    },
    jobPostings: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Job'
    }],
    applicationsReceived: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Application'
    }],
    ratings: {
        averageRating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot be more than 5']
        },
        totalRatings: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
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
EmployerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate average rating
EmployerSchema.methods.calculateAverageRating = function() {
    if (this.ratings.totalRatings === 0) {
        this.ratings.averageRating = 0;
    } else {
        this.ratings.averageRating = this.ratings.totalRatings / this.ratings.totalRatings;
    }
};

// Add job posting
EmployerSchema.methods.addJobPosting = function(jobId) {
    if (!this.jobPostings.includes(jobId)) {
        this.jobPostings.push(jobId);
    }
};

// Remove job posting
EmployerSchema.methods.removeJobPosting = function(jobId) {
    this.jobPostings = this.jobPostings.filter(id => id.toString() !== jobId.toString());
};

// Add application
EmployerSchema.methods.addApplication = function(applicationId) {
    if (!this.applicationsReceived.includes(applicationId)) {
        this.applicationsReceived.push(applicationId);
    }
};

module.exports = mongoose.model('Employer', EmployerSchema);
