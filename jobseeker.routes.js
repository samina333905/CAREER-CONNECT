const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const JobSeeker = require('../models/JobSeeker');
const Job = require('../models/Job');
const Project = require('../models/Project');
const User = require('../models/User');

// Apply auth middleware to all routes
router.use(auth);

// Get job seeker profile
router.get('/profile', async (req, res) => {
    console.log('Profile route hit');
    console.log('Authenticated user:', req.user);

    try {
        console.log('Finding job seeker for user:', req.user.id);
        const jobSeeker = await User.findOne( req.user.id )
            .populate('applications')
            .populate('savedJobs');

        console.log('Found job seeker:', jobSeeker);

        if (!jobSeeker) {
            console.log('No job seeker found');
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        res.json(jobSeeker);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

// Update job seeker profile
router.put('/profile', async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOneAndUpdate(
            { user: req.user.id },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        res.json(jobSeeker);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
});

// Search jobs
router.get('/jobs/search', async (req, res) => {
    const { title, location, jobType, experience } = req.query;

    try {
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

        const jobs = await Job.find(query)
            .populate('employer', 'companyName logo')
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Apply for a job
router.post('/apply/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const jobSeeker = await JobSeeker.findOne({ user: req.user.id });
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        // Add application
        await jobSeeker.addApplication(jobId);
        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Apply job error:', error);
        res.status(500).json({ message: 'Server error while applying for job' });
    }
});

// Save a job
router.post('/save/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const jobSeeker = await JobSeeker.findOne({ user: req.user.id });
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        // Save job
        await jobSeeker.saveJob(jobId);
        res.json({ message: 'Job saved successfully' });
    } catch (error) {
        console.error('Save job error:', error);
        res.status(500).json({ message: 'Server error while saving job' });
    }
});

// Get saved jobs
router.get('/saved-jobs', async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOne({ user: req.user.id })
            .populate('savedJobs');

        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        res.json(jobSeeker.savedJobs);
    } catch (error) {
        console.error('Get saved jobs error:', error);
        res.status(500).json({ message: 'Server error while fetching saved jobs' });
    }
});

// Get job applications
router.get('/applications', async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOne({ user: req.user.id })
            .populate('applications');

        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        res.json(jobSeeker.applications);
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: 'Server error while fetching applications' });
    }
});

// Add project with file upload
router.post('/projects', upload.single('projectFile'), async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOne({ user: req.user.id });
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        // Create a new project
        const project = new Project({
            title: req.body.title,
            description: req.body.description,
            technologies: req.body.technologies ? JSON.parse(req.body.technologies) : [],
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            username: req.user.firstName + ' ' + req.user.lastName,
            user: req.user.id,
            jobSeeker: jobSeeker._id
        });

        if (req.file) {
            project.projectFile = {
                path: req.file.path,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            };
        }

        // Save the project
        await project.save();

        // Add project to job seeker's projects array
        jobSeeker.addProject(project._id);
        await jobSeeker.save();

        res.status(201).json({ 
            message: 'Project added successfully',
            project: project
        });
    } catch (error) {
        console.error('Add project error:', error);
        res.status(500).json({ 
            message: 'Server error while adding project',
            error: error.message 
        });
    }
});

// Get all projects
router.get('/projects', async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOne({ user: req.user.id });
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        res.json(jobSeeker.projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error while fetching projects' });
    }
});

// Get single project
router.get('/projects/:projectId', async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOne({ user: req.user.id });
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        const project = jobSeeker.projects.id(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Server error while fetching project' });
    }
});

// Update project
router.put('/projects/:projectId', upload.single('projectFile'), async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOne({ user: req.user.id });
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        const project = jobSeeker.projects.id(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.title = req.body.title || project.title;
        project.description = req.body.description || project.description;
        project.technologies = req.body.technologies ? JSON.parse(req.body.technologies) : project.technologies;
        project.startDate = req.body.startDate || project.startDate;
        project.endDate = req.body.endDate || project.endDate;

        if (req.file) {
            project.projectFile = {
                path: req.file.path,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            };
        }

        await jobSeeker.save();
        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error while updating project' });
    }
});

// Delete project
router.delete('/projects/:projectId', async (req, res) => {
    try {
        const jobSeeker = await JobSeeker.findOne({ user: req.user.id });
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Job seeker profile not found' });
        }

        jobSeeker.removeProject(req.params.projectId);
        await jobSeeker.save();

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Server error while deleting project' });
    }
});

// Create job seeker profile
router.post('/profile', async (req, res) => {
    try {
        // Check if profile already exists
        const existingProfile = await JobSeeker.findOne({ user: req.user.id });
        if (existingProfile) {
            return res.status(400).json({ message: 'Profile already exists' });
        }

        // Create new profile
        const jobSeeker = new JobSeeker({
            user: req.user.id,
            ...req.body
        });

        await jobSeeker.save();
        res.status(201).json(jobSeeker);
    } catch (error) {
        console.error('Create profile error:', error);
        res.status(500).json({ message: 'Server error while creating profile' });
    }
});

module.exports = router; 