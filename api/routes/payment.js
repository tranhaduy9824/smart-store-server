const express = require("express");
const { create_payment, get_vnpay_return } = require("../untils/payment");
const checkAuth = require("../middleware/check-auth");
const router = express.Router();

router.post("/", checkAuth, create_payment);
router.get("/vnpay_return", get_vnpay_return);

module.exports = router;
