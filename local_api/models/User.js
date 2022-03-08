const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: String,
    lastname: String,
    email: {
                type: String,
                required: true
            },
    password: {
                type: String,
                required: true
            },
    role: {type: mongoose.Schema.ObjectId, ref: 'Role'}
})

userSchema.pre("save", function(next) {
    let user = this;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(user.password, salt);
    user.password = hash;
    next();
  });

module.exports = mongoose.model('User', userSchema);