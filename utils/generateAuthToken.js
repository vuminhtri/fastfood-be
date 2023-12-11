const jwt = require("jsonwebtoken");

const generateAuthToken = (user) => {
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(
        {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            image: user.image,
            phone: user.phone,
            gender: user.gender,
            dob: user.dob,
        },
        jwtSecretKey
    );

    return token;
};

module.exports = generateAuthToken;
