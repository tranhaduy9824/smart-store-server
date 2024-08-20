const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const shortid = require("shortid");

const ProductsController = require("../controllers/products");
const checkAuth = require("../middleware/check-auth");
const isShop = require("../middleware/is-shop");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}-${shortid.generate()}${path.extname(
        file.originalname
      )}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 11,
  },
  fileFilter: fileFilter,
});

router.post(
  "/",
  checkAuth,
  isShop,
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  ProductsController.products_create
);
router.get("/", ProductsController.products_get_all);
router.get("/category/", ProductsController.products_get_by_category);
router.get("/search", ProductsController.products_search);
router.get("/new", ProductsController.products_get_new);
router.get("/sale", ProductsController.products_get_sale);
router.get(
  "/recommend",
  (req, res, next) => {
    if (req.headers.authorization) {
      checkAuth(req, res, next);
    } else {
      next();
    }
  },
  ProductsController.products_get_recommend
);
router.get("/my-shop", checkAuth, isShop, ProductsController.products_get_my_shop);
router.get("/:id", ProductsController.products_get_one);
router.get("/shop/:shopId", ProductsController.products_get_by_shop);
router.delete(
  "/:id",
  checkAuth,
  (req, res, next) => {
    if (req.userData.role === "admin") {
      next();
    } else if (req.userData.role === "user") {
      isShop(req, res, next);
    }
  },
  ProductsController.products_delete
);
router.patch(
  "/:id",
  checkAuth,
  (req, res, next) => {
    if (req.userData.role === "admin") {
      next();
    } else if (req.userData.role === "user") {
      isShop(req, res, next);
    }
  },
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  ProductsController.products_update
);

module.exports = router;
