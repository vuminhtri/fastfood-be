const express = require("express");
const Stripe = require("stripe");
const { Order } = require("../models/order");

require("dotenv").config();
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_KEY);

router.post("/create-checkout-session", async (req, res) => {
    const customer = await stripe.customers.create({
        metadata: {
            userId: req.body.userId,
            // cart: JSON.stringify(req.body.cart),
        },
    });


    // const line_items = req.body.cart.map((item) => {
    //     return {
    //         price_data: {
    //             currency: "vnd",
    //             product_data: {
    //                 name: item.name,
    //                 images: [item.image.url],
    //                 // option: item.optionOrder,
    //                 // note: item.note ? item.note : "",
    //                 metadata: { id: item.id },
    //             },
    //             unit_amount: item.price,
    //         },
    //         quantity: item.cartQuantity,
    //     };
    // });

    const calculateTotalPrice = (item) => {
        let totalPrice = item.price;
        for (const option of item.optionOrder) {
            totalPrice += option.price;
        }
        return totalPrice;
    };

    const line_items = req.body.cart.map((item) => {
        return {
            price_data: {
                currency: "vnd",
                product_data: {
                    name: item.name,
                    images: [item.image.url],
                    metadata: { 
                        id: item.id,
                        optionOrder: JSON.stringify(item.optionOrder), 
                        note: item.note,                     },
                    description: item.optionOrder.map(option => `x1 ${option.name}: ${option.price}đ`).join('<br>') || [],
                },
                unit_amount: calculateTotalPrice(item), 
            },
            quantity: item.cartQuantity,
        };
    });
    console.log(line_items)

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        shipping_address_collection: {
            allowed_countries: ["US", "CA", "VN"],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: 15000,
                        currency: "vnd",
                    },
                    display_name: "Giao hàng nhanh",
                    delivery_estimate: {
                        minimum: {
                            unit: "hour",
                            value: 1,
                        },
                        maximum: {
                            unit: "hour",
                            value: 2,
                        },
                    },
                },
            },
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: 30000,
                        currency: "vnd",
                    },
                    display_name: "Giao hàng hỏa tốc",
                    delivery_estimate: {
                        minimum: {
                            unit: "hour",
                            value: 1,
                        },
                        maximum: {
                            unit: "hour",
                            value: 2,
                        },
                    },
                },
            },
        ],
        phone_number_collection: {
            enabled: true,
        },
        line_items,
        mode: "payment",
        customer: customer.id,
        success_url: `${process.env.CLIENT_URL}/checkout-success`,
        cancel_url: `${process.env.CLIENT_URL}/cart`,
    });
    res.send({ url: session.url });
});

const createOrder = async (customer, data, lineItems) => {
    const newOrder = new Order({
        userId: customer.metadata.userId,
        customerId: data.customer,
        paymentIntentId: data.payment_intent,
        products: lineItems.data,
        // products: lineItems.data.map(item => {
        //     return {
        //         productId: item.price.product_data.metadata.id,
        //         quantity: item.quantity,
        //         optionOrder: item.price.product_data.optionOrder || [],
        //         note: item.price.product_data.note || "",
        //     };
        // }),
        subtotal: data.amount_subtotal,
        total: data.amount_total,
        shipping: data.customer_details,
        payment_status: data.payment_status,
    });

    try {
        const savedOrder = await newOrder.save();
        console.log("Processed Order:", savedOrder);
    } catch (err) {
        console.log(err);
    }
};

// const endpointSecret =
//     "whsec_ec23ff22d55c57872c071fa1e60c8236ae743815f14ab0c1d653c717617fa5ad";

//Stripe Webhook
router.post(
    "/webhook",
    express.json({ type: "application/json" }),
    async (req, res) => {
        let data;
        let eventType;

        // Check if webhook signing is configured.
        let webhookSecret;
        //webhookSecret = process.env.STRIPE_WEB_HOOK;

        if (webhookSecret) {
            // Retrieve the event by verifying the signature using the raw body and secret.
            let event;
            let signature = req.headers["stripe-signature"];

            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    signature,
                    webhookSecret
                );
            } catch (err) {
                console.log(
                    `⚠️  Webhook signature verification failed:  ${err}`
                );
                return res.sendStatus(400);
            }
            data = event.data.object;
            eventType = event.type;
        } else {
            data = req.body.data.object;
            eventType = req.body.type;
        }

        if (eventType === "checkout.session.completed") {
            stripe.customers
                .retrieve(data.customer)
                .then(async (customer) => {
                    // try {
                    //     // CREATE ORDER
                    //     createOrder(customer, data);
                    // } catch (err) {
                    //     console.log(typeof createOrder);
                    //     console.log(err);
                    // }

                    stripe.checkout.sessions.listLineItems(
                        data.id,
                        {},
                        function (err, line_items) {
                            console.log("line_items", lineItems);
                            createOrder(customer, data, lineItems);
                        }
                    );
                })
                .catch((err) => console.log("189", err.message));
        }
        res.send().end();
    }
);

module.exports = router;
