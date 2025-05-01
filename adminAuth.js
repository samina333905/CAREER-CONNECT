const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized as admin' });
        }

        // Get admin from database
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(401).json({ msg: 'Admin not found' });
        }

        req.admin = admin;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}; 