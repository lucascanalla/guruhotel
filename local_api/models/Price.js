var mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    room_id: String,
    hotel_id: Number,
    date: Date,
    competitor_name: String,
    amount: Number,
    currency: String,
    taxes: Number,
    created_at: Date
})

module.exports =  mongoose.model('Price', priceSchema);