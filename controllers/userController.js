const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { calculateDistance } = require('../utils/geoUtils');

// ------------------- Create User -------------------
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, address, latitude, longitude } = req.body;

        // Validations
        if (!name || !email || !password || !address || !latitude || !longitude) {
            return res.status(400).json({ status_code: 400, message: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status_code: 400, message: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ status_code: 400, message: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status_code: 400, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name, email, password: hashedPassword,
            address, latitude, longitude,
            status: 'active' // default
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            status_code: 200,
            message: 'User created',
            data: { ...user._doc, token, password: undefined }
        });
    } catch (err) {
        res.status(500).json({ status_code: 500, message: err.message });
    }
};

// ------------------- Toggle All Users Status -------------------
exports.toggleUserStatus = async (req, res) => {
    try {
        await User.updateMany(
            {},
            [{ $set: { status: { $cond: [{ $eq: ['$status', 'active'] }, 'inactive', 'active'] } } }]
        );

        res.json({ status_code: 200, message: 'All user statuses toggled' });
    } catch (err) {
        res.status(500).json({ status_code: 500, message: err.message });
    }
};

// ------------------- Get Distance -------------------
exports.getDistance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        const { destination_latitude, destination_longitude } = req.query;

        if (!destination_latitude || !destination_longitude) {
            return res.status(400).json({ status_code: 400, message: 'Destination latitude and longitude required' });
        }

        const distance = calculateDistance(
            user.latitude, user.longitude,
            Number(destination_latitude), Number(destination_longitude)
        );

        res.json({ status_code: 200, message: 'Success', distance: `${distance} km` });
    } catch (err) {
        res.status(500).json({ status_code: 500, message: err.message });
    }
};

// ------------------- User Listing -------------------
exports.userListing = async (req, res) => {
    try {
        if (!req.query.week_number) {
            return res.status(400).json({ status_code: 400, message: 'week_number is required' });
        }

        const weekNumbers = req.query.week_number.split(',').map(Number); // e.g., [0,2,3]
        const dayMapping = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

        const users = await User.find({});

        const result = {};
        weekNumbers.forEach(num => {
            const dayName = dayMapping[num];
            result[dayName] = users
                .filter(u => new Date(u.register_at).getDay() === num)
                .map(u => ({ name: u.name, email: u.email }));
        });

        res.json({ status_code: 200, message: 'Success', data: result });
    } catch (err) {
        res.status(500).json({ status_code: 500, message: err.message });
    }
};
