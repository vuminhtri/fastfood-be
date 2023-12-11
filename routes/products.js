const { auth, isUser, isAdmin } = require("../middleware/auth");
const { Product } = require("../models/product");
const cloudinary = require("../utils/cloudinary");

const router = require("express").Router();

//CREATE

router.post("/", isAdmin, async (req, res) => {
    const { name, category, desc, price, image, extraOptions } = req.body;
    console.log(req.body);
    try {
        if (image) {
            const uploadedResponse = await cloudinary.uploader.upload(image, {
                folder: "Fastfood-Shop",
            });

            if (uploadedResponse) {
                const product = new Product({
                    name,
                    category,
                    desc,
                    price,
                    image: uploadedResponse,
                    extraOptions
                });
                console.log(product)

                const savedProduct = await product.save();
                res.status(200).send(savedProduct);
            }
        }
    } catch (error) {
        console.log("Error create product: " + error);
        res.status(500).send(error);
    }
});

//GET ALL PRODUCTS

router.get("/", async (req, res) => {
    // const qcategory = req.query.category;
    try {
        // let products;

        // if (qcategory) {
        //     products = await Product.find({
        //         category: qcategory,
        //     });
        // } else {
        //     products = await Product.find();
        // }
        const products = await Product.find();
        res.status(200).send(products);
    } catch (error) {
        res.status(500).send(error);
    }
});

//GET PRODUCT

router.get("/find/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.status(200).send(product);
    } catch (error) {
        res.status(500).send(error);
    }
});

//UPDATE

// router.put("/:id", async (req, res) => {
// try {
//     const updatedProduct = await Product.findByIdAndUpdate(
//         req.params.id,
//         {
//             $set: req.body,
//         },
//         { new: true }
//     );
//     res.status(200).send(updatedProduct);
// } catch (error) {
//     res.status(500).send(error);
//     }
// });
router.put("/:id", isAdmin, async (req, res) => {
    if (req.body.productImg) {
        try {
            const destroyResponse = await cloudinary.uploader.destroy(
                req.body.product.image.public_id
            );

            if (destroyResponse) {
                const uploadedResponse = await cloudinary.uploader.upload(
                    req.body.productImg,
                    {
                        folder: "Fastfood-Shop",
                    }
                );

                if (uploadedResponse) {
                    const updatedProduct = await Product.findByIdAndUpdate(
                        req.params.id,
                        {
                            $set: {
                                ...req.body.product,
                                image: uploadedResponse,
                            },
                        },
                        { new: true }
                    );

                    res.status(200).send(updatedProduct);
                }
            }
        } catch (error) {
            res.status(500).send(error);
        }
    } else {
        try {
            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    $set: req.body.product,
                },
                { new: true }
            );
            res.status(200).send(updatedProduct);
        } catch (error) {
            res.status(500).send(error);
        }
    }
});

//DELETE

router.delete("/:id", isAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).send("Product has been deleted...");
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
