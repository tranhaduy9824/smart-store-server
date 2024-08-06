const express = require("express");
const router = express.Router();

const OrdersController = require("../controllers/orders");
const checkAuth = require("../middleware/check-auth");
const getShop = require("../middleware/getShop");

router.post("/", checkAuth, OrdersController.orders_create);
router.get("/:id", checkAuth, OrdersController.orders_get_by_id);
router.get("/", checkAuth, OrdersController.orders_get_by_user);
router.patch(
  "/:id",
  checkAuth,
  (req, res, next) => {
    if (req.userData.role === "admin") {
      next();
    } else if (req.userData.role === "user") {
      getShop(req, res, next);
    } else {
      next();
    }
  },
  OrdersController.orders_update
);

module.exports = router;
