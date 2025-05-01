const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const { auth } = require('../middleware/auth');


console.log('auth middleware:', auth);


// Get employer profile
router.get('/profile', auth, async (req, res) => {
    try {
        const employer = await Employer.findById(req.user.id).select('-password');
        res.json(employer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update employer profile
router.put('/profile', auth, async (req, res) => {
    const {
        companyName,
        companyDescription,
        industry,
        location,
        website,
        phone,
        logo
    } = req.body;

    try {
        const employer = await Employer.findById(req.user.id);
        if (!employer) {
            return res.status(404).json({ msg: 'Employer not found' });
        }

        employer.companyName = companyName || employer.companyName;
        employer.companyDescription = companyDescription || employer.companyDescription;
        employer.industry = industry || employer.industry;
        employer.location = location || employer.location;
        employer.website = website || employer.website;
        employer.phone = phone || employer.phone;
        employer.logo = logo || employer.logo;

        await employer.save();
        res.json(employer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Post a new job
router.post('/jobs', auth, async (req, res) => {
    const {
        title,
        description,
        requirements,
        responsibilities,
        salary,
        location,
        jobType,
        experience,
        education,
        skills
    } = req.body;

    try {
        const newJob = new Job({
            title,
            description,
            requirements,
            responsibilities,
            salary,
            location,
            jobType,
            experience,
            education,
            skills,
            employer: req.user.id,
            isPremium: req.user.isPremium
        });

        const job = await newJob.save();
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all jobs posted by employer
router.get('/jobs', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ employer: req.user.id })
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update job
router.put('/jobs/:id', auth, async (req, res) => {
    const {
        title,
        description,
        requirements,
        responsibilities,
        salary,
        location,
        jobType,
        experience,
        education,
        skills,
        isActive
    } = req.body;

    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        if (job.employer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        job.title = title || job.title;
        job.description = description || job.description;
        job.requirements = requirements || job.requirements;
        job.responsibilities = responsibilities || job.responsibilities;
        job.salary = salary || job.salary;
        job.location = location || job.location;
        job.jobType = jobType || job.jobType;
        job.experience = experience || job.experience;
        job.education = education || job.education;
        job.skills = skills || job.skills;
        job.isActive = isActive !== undefined ? isActive : job.isActive;

        await job.save();
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get applications for a job
router.get('/jobs/:id/applications', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('applications.jobSeeker', 'fullName email phone location skills experience education');

        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        if (job.employer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(job.applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update application status
router.put('/jobs/:jobId/applications/:applicationId', auth, async (req, res) => {
    const { status } = req.body;

    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        if (job.employer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const application = job.applications.id(req.params.applicationId);
        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        application.status = status;
        await job.save();

        res.json(application);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 