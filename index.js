const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const register = require("./routes/register");
const login = require("./routes/login");
const stripe = require("./routes/stripe");
const products = require("./routes/products");
const users = require("./routes/users");
const orders = require("./routes/orders");

// const products = require("./products");

const app = express();
app.use(express.json({limit: "10mb"}));
app.use(cors());
require("dotenv").config();

const port = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("MongoDB connection established..."))
    .catch((error) =>
        console.error("MongoDB connection failed: ", error.message)
    );

app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/stripe", stripe);
app.use("/api/products", products);
app.use("/api/users", users);
app.use("/api/orders", orders);

app.get("/", (req, res) => {
    res.send("Server is running...");
});

// app.get("/products", (req, res) => {
//     res.send(products);
// });

app.listen(port, console.log("Server is running at port:", port));
