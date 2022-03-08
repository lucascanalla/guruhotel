var mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    type: String
})

module.exports =  mongoose.model('Role', roleSchema);