const express = require("express");
const router = express.Router();

const WishlistController = require("../controllers/wishlist");

router.post("/", WishlistController.wishlist_add);
router.get("/:userId", WishlistController.wishlist_get_user);
router.delete("/", WishlistController.wishlist_remove);

module.exports = router;
