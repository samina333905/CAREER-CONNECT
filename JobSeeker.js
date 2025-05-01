const mongoose = require('mongoose');

const JobSeekerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        firstName: {
            type: String,
            required: [true, 'Please add your first name'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Please add your last name'],
            trim: true
        },
        email: String,
        phone: {
            type: String,
            match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number']
        },
        location: {
            address: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer not to say']
        }
    },
    professionalInfo: {
        headline: String,
        summary: String,
        currentPosition: String,
        currentCompany: String,
        yearsOfExperience: Number,
        skills: [String],
        languages: [String]
    },
    education: [{
        institution: {
            type: String,
            required: true
        },
        degree: {
            type: String,
            required: true
        },
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        current: {
            type: Boolean,
            default: false
        },
        description: String,
        grade: String
    }],
    experience: [{
        title: {
            type: String,
            required: true
        },
        company: {
            type: String,
            required: true
        },
        location: String,
        startDate: Date,
        endDate: Date,
        current: {
            type: Boolean,
            default: false
        },
        description: String,
        achievements: [String]
    }],
    projects: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Project'
    }],
    certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        credentialUrl: String
    }],
    resume: {
        fileUrl: String,
        fileName: String,
        fileSize: Number,
        uploadedAt: Date,
        lastUpdated: Date
    },
    jobPreferences: {
        desiredJobTitles: [String],
        desiredIndustries: [String],
        desiredJobTypes: [String],
        desiredLocations: [String],
        minSalary: Number,
        maxSalary: Number,
        remoteWork: Boolean
    },
    applications: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Job'
    }],
    savedJobs: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Job'
    }],
    profileVisibility: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public'
    },
    profileCompletion: {
        type: Number,
        default: 0
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
JobSeekerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate profile completion percentage
JobSeekerSchema.methods.calculateProfileCompletion = function() {
    let completion = 0;
    const totalFields = 8; // Adjust based on required fields

    if (this.personalInfo.firstName && this.personalInfo.lastName) completion++;
    if (this.personalInfo.email) completion++;
    if (this.professionalInfo.headline) completion++;
    if (this.professionalInfo.summary) completion++;
    if (this.professionalInfo.skills && this.professionalInfo.skills.length > 0) completion++;
    if (this.education && this.education.length > 0) completion++;
    if (this.experience && this.experience.length > 0) completion++;
    if (this.projects && this.projects.length > 0) completion++;

    this.profileCompletion = (completion / totalFields) * 100;
};

// Add project
JobSeekerSchema.methods.addProject = function(projectId) {
    if (!this.projects.includes(projectId)) {
        this.projects.push(projectId);
    }
    this.calculateProfileCompletion();
};

// Remove project
JobSeekerSchema.methods.removeProject = function(projectId) {
    this.projects = this.projects.filter(id => id.toString() !== projectId.toString());
    this.calculateProfileCompletion();
};

// Add application
JobSeekerSchema.methods.addApplication = function(jobId) {
    if (!this.applications.includes(jobId)) {
        this.applications.push(jobId);
    }
};

// Save job
JobSeekerSchema.methods.saveJob = function(jobId) {
    if (!this.savedJobs.includes(jobId)) {
        this.savedJobs.push(jobId);
    }
};

// Remove saved job
JobSeekerSchema.methods.removeSavedJob = function(jobId) {
    this.savedJobs = this.savedJobs.filter(id => id.toString() !== jobId.toString());
};

module.exports = mongoose.model('JobSeeker', JobSeekerSchema);
