const express = require("express");
const router = express.Router();

const ReviewController = require("../controllers/review");

router.post("/", ReviewController.review_add);
router.get("/:productId", ReviewController.review_get_product);
router.patch("/:reviewId", ReviewController.review_update);
router.delete("/:reviewId", ReviewController.review_delete);

module.exports = router;
