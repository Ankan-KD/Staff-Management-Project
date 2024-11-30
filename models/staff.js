const mongoose = require('mongoose');

// Define the schema
const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    email: { type: String, required: true }
});

// Export the model
module.exports = mongoose.model('Staff', staffSchema);
