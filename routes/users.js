const moment = require("moment");
const bcrypt = require("bcrypt");
const router = require("express").Router();
const { User } = require("../models/user");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");
const generateAuthToken = require("../utils/generateAuthToken");
const Joi = require("joi");

// GET ALL USERS
router.get("/", isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ _id: -1 });
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

// DELETE
router.delete("/:id", isAdmin, async (req, res) => {
    try {
        const deleteOrder = await User.findByIdAndDelete(req.params.id);
        res.status(200).send(deleteOrder);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET USER
router.get("/find/:id", isUser, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.status(200).send({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put("/password/:id", isUser, async (req, res) => {
    try {
        console.log("Req", req.body);
        const schema = Joi.object({
            currentPassword: Joi.string().min(6).max(200).required(),
            newPassword: Joi.string().min(6).max(200).required(),
            confirmPassword: Joi.string().min(6).max(200).required(),
        });

        const { error } = schema.validate({
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword,
            confirmPassword: req.body.confirmPassword,
        });

        if (error) return res.status(400).send(error.details[0].message);

        const user = await User.findById(req.params.id);
        console.log(user);
        const validPassword = await bcrypt.compare(
            req.body.currentPassword,
            user.password
        );
        if (!validPassword) return res.status(400).send("Invalid password...");

        if (req.body.newPassword !== req.body.confirmPassword)
            return res.status(400).send("Password entered is different");

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(req.body.newPassword, salt);

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                password: newPassword,
            },
            { new: true }
        );
        const token = generateAuthToken(updatedUser);
        res.status(200).send(token);
    } catch (error) {
        res.status(500).send(error);
    }
});

// UPDATE USER
router.put("/profile/:id", isUser, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        let uploadedResponse;
        if (!(user.email === req.body.email)) {
            const emailInUse = await User.findOne({ email: req.body.email });
            if (emailInUse)
                return res.status(400).send("That email is already taken...");
        }

        if (req.body.image) {
            uploadedResponse = await cloudinary.uploader.upload(
                req.body.image,
                {
                    folder: "Fastfood-Shop/user-image",
                }
            );
        }

        if (user.image) {
            const public_id = user.image.public_id;

            await cloudinary.uploader.destroy(public_id);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                gender: req.body.gender,
                dob: req.body.day + "/" + req.body.month + "/" + req.body.year,
                image: req.body.image ? uploadedResponse : "",
                isAdmin: user.isAdmin,
                password: user.password,
            },
            { new: true }
        );
        const token = generateAuthToken(updatedUser);

        res.status(200).send(token);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET USER STATS
router.get("/stats", async (req, res) => {
    const previousMonth = moment()
        .month(moment().month() - 1)
        .set("date", 1)
        .format("YYYY-MM-DD HH:mm:ss");
    try {
        const users = await User.aggregate([
            {
                $match: { createdAt: { $gte: new Date(previousMonth) } },
            },
            {
                $project: {
                    month: { $month: "$createdAt" },
                },
            },
            {
                $group: {
                    _id: "$month",
                    total: { $sum: 1 },
                },
            },
        ]);
        res.status(200).send(users);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

module.exports = router;
