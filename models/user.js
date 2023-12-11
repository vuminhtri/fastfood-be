const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, require: true, minlength: 3, maxlength: 30 },
        email: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 200,
            unique: true,
        },
        image: { type: Object},
        phone: {type: String, minlength: 10},
        gender: {type: String},
        dob: {type: String},
        password: { type: String, required: true, minlength: 6, maxlength: 1024 },
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

exports.User = User;