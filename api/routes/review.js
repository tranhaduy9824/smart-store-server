const express = require("express");
const router = express.Router();

const ReviewController = require("../controllers/review");
const checkAuth = require("../middleware/check-auth");
const isShop = require("../middleware/is-shop");

router.post("/", checkAuth, ReviewController.review_add);
router.get("/my-shop", checkAuth, isShop, ReviewController.review_get_by_shop);
router.get("/:productId", ReviewController.review_get_by_product);
router.get("/me/:orderId", checkAuth, ReviewController.review_get_by_order);
router.patch("/:reviewId", checkAuth, ReviewController.review_update);
router.delete("/:reviewId", checkAuth, ReviewController.review_delete);

module.exports = router;
