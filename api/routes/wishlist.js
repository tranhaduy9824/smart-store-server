const express = require("express");
const router = express.Router();

const WishlistController = require("../controllers/wishlist");
const checkAuth = require("../middleware/check-auth");

router.post("/", checkAuth, WishlistController.wishlist_add);
router.get("/", checkAuth, WishlistController.wishlist_get_user);
router.delete("/", checkAuth, WishlistController.wishlist_remove);

module.exports = router;
