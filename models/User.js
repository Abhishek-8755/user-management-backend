const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    register_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
