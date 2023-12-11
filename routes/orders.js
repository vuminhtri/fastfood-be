const moment = require("moment");
const router = require("express").Router();
const { Order } = require("../models/order");
const { auth, isUser, isAdmin } = require("../middleware/auth");

//CREATE

router.post("/", async (req, res) => {
    const newOrder = new Order(req.body);

    try {
        const savedOrder = await newOrder.save();
        res.status(200).send(savedOrder);
    } catch (err) {
        res.status(500).send(err);
    }
});

//UPDATE
router.put("/:id", isAdmin, async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body,
            },
            { new: true }
        );
        res.status(200).send(updatedOrder);
    } catch (err) {
        res.status(500).send(err);
    }
});

//DELETE
router.delete("/:id", isAdmin, async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.status(200).send("Order has been deleted...");
    } catch (err) {
        res.status(500).send(err);
    }
});

// GET AN ORDER
router.get("/findOne/:id", isUser, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if(req.user._id === order.userId || req.user.isAdmin)
            return res.status(200).send(order);
        return res.status(403).send("Access denied. Not authorized...")
    } catch (err) {
        res.status(500).send(err);
    }
});

//GET USER ORDERS
router.get("/find/:userId", isUser, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId });
        res.status(200).send(orders);
    } catch (err) {
        res.status(500).send(err);
    }
});

// GET ORDERS
router.get("/", isAdmin, async (req, res) => {
    const query = req.query.new;
    try {
        const orders = query
            ? await Order.find().sort({ _id: -1 }).limit(4)
            : await Order.find().sort({ _id: -1 });
        res.status(200).send(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

// GET ORDER STATS
router.get("/stats", isAdmin, async (req, res) => {
    const previousMonth = moment()
        .month(moment().month() - 1)
        .set("date", 1)
        .format("YYYY-MM-DD HH:mm:ss");
    try {
        const orders = await Order.aggregate([
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
        res.status(200).send(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

router.get("/income/stats", isAdmin, async (req, res) => {
    const previousMonth = moment()
        .month(moment().month() - 1)
        .set("date", 1)
        .format("YYYY-MM-DD HH:mm:ss");
    try {
        const income = await Order.aggregate([
            {
                $match: { createdAt: { $gte: new Date(previousMonth) } },
            },
            {
                $project: {
                    month: { $month: "$createdAt" },
                    sales: "$total",
                },
            },
            {
                $group: {
                    _id: "$month",
                    total: { $sum: "$sales" },
                },
            },
        ]);
        res.status(200).send(income);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

// GET 1 WEEK SALES
router.get("/week-sales", isAdmin, async (req, res) => {
    const last7Days = moment()
        .day(moment().day() - 7)
        .format("YYYY-MM-DD HH:mm:ss");
    // console.log(last7Days)
    try {
        const income = await Order.aggregate([
            {
                $match: { createdAt: { $gte: new Date(last7Days) } },
            },
            {
                $project: {
                    day: { $dayOfWeek: "$createdAt" },
                    sales: "$total",
                },
            },
            {
                $group: {
                    _id: "$day",
                    total: { $sum: "$sales" },
                },
            },
        ]);
        res.status(200).send(income);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

module.exports = router;
