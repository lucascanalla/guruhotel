var mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    room_id: String,
    hotel_id: Number,
    room_name: String,
    room_type: String,
    bed_count: Number,
    amenities: [String]
})

module.exports =  mongoose.model('Room', roomSchema);