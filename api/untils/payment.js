const crypto = require("crypto");
const Order = require("../models/order");

const createSignature = (params, secretKey) => {
  const queryString = Object.keys(params)
    .filter((key) => key !== "vnp_SecureHash" && key !== "vnp_SecureHashType")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto
    .createHmac("sha512", secretKey)
    .update(queryString)
    .digest("hex");
};

const VNPAY_TMN_CODE = "E5JKSBQU";
const VNPAY_SECRET_KEY = "ZIFHEGSHLOKXSQXQUFBRORSYBLZAQFBF";
const VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

exports.create_payment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res
        .status(400)
        .json({ error: "Thiếu thông tin amount hoặc orderId" });
    }

    const amountInVND = parseFloat(amount) * 100;
    if (isNaN(amountInVND) || amountInVND <= 0) {
      return res.status(400).json({ error: "Số tiền không hợp lệ" });
    }

    const ipAddr =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const vnpParams = {
      vnp_Version: "2.0.0",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: amountInVND.toString(),
      vnp_Command: "pay",
      vnp_CreateDate: new Date()
        .toISOString()
        .replace(/[-:T]/g, "")
        .split(".")[0],
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: "Thanh toán đơn hàng #" + orderId,
      vnp_OrderType: "billpayment",
      vnp_ReturnUrl: `${process.env.BASE_URL_CLIENT}`,
      vnp_TxnRef: orderId,
    };

    const hash = createSignature(vnpParams, VNPAY_SECRET_KEY);
    const querystring = new URLSearchParams(vnpParams).toString();
    const vnpUrl = `${VNPAY_URL}?${querystring}&vnp_SecureHash=${hash}`;

    res.json({ redirectUrl: vnpUrl });
  } catch (error) {
    console.error("Lỗi khi tạo URL thanh toán:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi tạo URL thanh toán" });
  }
};

exports.get_vnpay_return = async (req, res) => {
  try {
    const orderId = req.query["vnp_TxnRef"];
    const rspCode = req.query["vnp_ResponseCode"];

    if (rspCode === "00") {
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          allStatus: "delivering",
          "items.$[].status": "delivering",
        },
      });
      res.json({
        code: rspCode,
        messageSuccess: "Payment successful",
      });
    } else {
      res.json({ code: rspCode, message: "Payment failed" });
    }
  } catch (error) {
    console.error("Return error:", error);
    res.status(500).send("An error occurred during return processing");
  }
};
