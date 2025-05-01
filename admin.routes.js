const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const JobSeeker = require('../models/JobSeeker');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Admin login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all job seekers
router.get('/jobseekers', adminAuth, async (req, res) => {
    try {
        const jobSeekers = await JobSeeker.find().select('-password');
        res.json(jobSeekers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all employers
router.get('/employers', adminAuth, async (req, res) => {
    try {
        const employers = await Employer.find().select('-password');
        res.json(employers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all jobs
router.get('/jobs', adminAuth, async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('employer', 'companyName')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update job seeker premium status
router.put('/jobseekers/:id/premium', adminAuth, async (req, res) => {
    const { isPremium, premiumExpiry } = req.body;

    try {
        const jobSeeker = await JobSeeker.findById(req.params.id);
        if (!jobSeeker) {
            return res.status(404).json({ msg: 'Job seeker not found' });
        }

        jobSeeker.isPremium = isPremium;
        jobSeeker.premiumExpiry = premiumExpiry;
        await jobSeeker.save();

        res.json(jobSeeker);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update employer premium status
router.put('/employers/:id/premium', adminAuth, async (req, res) => {
    const { isPremium, premiumExpiry } = req.body;

    try {
        const employer = await Employer.findById(req.params.id);
        if (!employer) {
            return res.status(404).json({ msg: 'Employer not found' });
        }

        employer.isPremium = isPremium;
        employer.premiumExpiry = premiumExpiry;
        await employer.save();

        res.json(employer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete job seeker
router.delete('/jobseekers/:id', adminAuth, async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findById(req.params.id);
        if (!jobSeeker) {
            return res.status(404).json({ msg: 'Job seeker not found' });
        }

        await jobSeeker.remove();
        res.json({ msg: 'Job seeker removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete employer
router.delete('/employers/:id', adminAuth, async (req, res) => {
    try {
        const employer = await Employer.findById(req.params.id);
        if (!employer) {
            return res.status(404).json({ msg: 'Employer not found' });
        }

        await employer.remove();
        res.json({ msg: 'Employer removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete job
router.delete('/jobs/:id', adminAuth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        await job.remove();
        res.json({ msg: 'Job removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 