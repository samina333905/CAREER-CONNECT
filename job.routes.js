const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Job = require('../models/Job');
const Employer = require('../models/Employer');

// Get all jobs
router.get('/', async (req, res) => {
    try {
        const jobs = await Job.find({ isActive: true })
            .populate('employer', 'companyName companyLogo')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get job by ID
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('employer', 'companyName companyLogo companyDescription');
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new job (Employer only)
router.post('/', auth, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        const employer = await Employer.findOne({ user: req.user.id });
        
        if (!employer) {
            return res.status(404).json({ message: 'Employer profile not found' });
        }

        const job = new Job({
            ...req.body,
            employer: employer._id
        });

        await job.save();
        
        // Add job to employer's job postings
        employer.addJobPosting(job._id);
        await employer.save();

        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update job (Employer only)
router.put('/:id', auth, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if the employer owns this job
        const employer = await Employer.findOne({ user: req.user.id });
        if (job.employer.toString() !== employer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this job' });
        }

        Object.assign(job, req.body);
        await job.save();
        
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete job (Employer only)
router.delete('/:id', auth, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if the employer owns this job
        const employer = await Employer.findOne({ user: req.user.id });
        if (job.employer.toString() !== employer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this job' });
        }

        // Soft delete
        job.isActive = false;
        await job.save();

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search jobs
router.get('/search', async (req, res) => {
    try {
        const { title, location, jobType, experience, skills } = req.query;
        
        let query = { isActive: true };

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (jobType) {
            query.jobType = jobType;
        }

        if (experience) {
            query.experience = experience;
        }

        if (skills) {
            query.skills = { $in: skills.split(',') };
        }

        const jobs = await Job.find(query)
            .populate('employer', 'companyName companyLogo')
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get jobs by employer
router.get('/employer/:employerId', async (req, res) => {
    try {
        const jobs = await Job.find({
            employer: req.params.employerId,
            isActive: true
        })
        .populate('employer', 'companyName companyLogo')
        .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get similar jobs
router.get('/similar/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const similarJobs = await Job.find({
            _id: { $ne: job._id },
            isActive: true,
            $or: [
                { title: { $regex: job.title, $options: 'i' } },
                { skills: { $in: job.skills } },
                { jobType: job.jobType }
            ]
        })
        .populate('employer', 'companyName companyLogo')
        .limit(5);

        res.json(similarJobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 