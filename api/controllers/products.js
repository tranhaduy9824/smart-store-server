const mongoose = require("mongoose");
const Product = require("../models/product");
const Order = require("../models/order");
const cloudinary = require("../untils/imageUpload");
const shortid = require("shortid");
const fs = require("fs");
const { getPublicIdFromUrl } = require("../untils/getPublicIdFromUrl");
const { recommendProducts } = require("../untils/recommendProducts");

exports.products_create = async (req, res, next) => {
  try {
    const photoUploadPromises = req.files.photos.map(async (photo) => {
      try {
        const photoId = shortid.generate();
        const result = await cloudinary.uploader.upload(photo.path, {
          public_id: `${req.body.name}_${photoId}`,
        });
        await fs.promises.unlink(photo.path);
        return result.secure_url;
      } catch (err) {
        console.error(err);
        throw new Error("Invalid image file for photos");
      }
    });
    const photoUrls = await Promise.all(photoUploadPromises);

    let videoUrl;
    if (req.files.video && req.files.video.length > 0) {
      try {
        const videoResult = await cloudinary.uploader.upload(
          req.files.video[0].path,
          {
            public_id: `${req.body.name}_video`,
            resource_type: "video",
          }
        );
        await fs.promises.unlink(req.files.video[0].path);
        videoUrl = videoResult.secure_url;
      } catch (err) {
        console.error(err);
        throw new Error("Invalid image file for video");
      }
    }

    const product = new Product({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      des: req.body.des,
      price: req.body.price,
      sale: req.body.sale,
      files: {
        photos: photoUrls,
        video: videoUrl,
      },
      category: req.body.category,
      categorySub: req.body.categorySub,
      shippingCost: req.body.shippingCost,
      shop: req.shop._id,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      message: "Created product successfully",
      createdProduct: savedProduct,
    });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid image file for photos") {
      return res.status(400).json({
        error: {
          message: err.message,
          name: err.name,
          http_code: 400,
        },
      });
    } else if (err.message === "Invalid image file for video") {
      return res.status(400).json({
        error: {
          message: err.message,
          name: err.name,
        },
      });
    } else {
      return res.status(500).json({
        error: {
          message: "An error occurred while creating the product.",
          name: err.name,
        },
      });
    }
  }
};

exports.products_get_all = async (req, res, next) => {
  try {
    const { category, categorySub, priceRange, sort, sale } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (categorySub) {
      query.categorySub = categorySub;
    }

    if (priceRange) {
      query.price = {};
      if (priceRange.from !== undefined) query.price.$gte = priceRange.from;
      if (priceRange.to !== undefined) query.price.$lte = priceRange.to;
    }

    if (sale) {
      query.sale = { $gt: 0 };
    }

    let sortOption = {};
    switch (parseInt(sort)) {
      case 1:
        const purchaseCount = await Order.aggregate([
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              purchaseCount: { $sum: "$items.quantity" },
            },
          },
          { $sort: { purchaseCount: -1 } },
        ]);
        const productOrder = purchaseCount.map((item) => item._id.toString());
        query._id = { $in: productOrder };
        sortOption = { purchaseCount: -1 };
        break;
      case 2:
        sortOption = { rating: -1 };
        break;
      case 3:
        sortOption = { createdAt: -1 };
        break;
      case 4:
        sortOption = { price: 1 };
        break;
      case 5:
        sortOption = { price: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    if (sale) {
      sortOption = { sale: -1 };
    }

    const products = await Product.find(query)
      .populate("shop")
      .sort(sortOption);

    res.status(200).json({
      message: "Products found",
      data: {
        count: products.length,
        products: products,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.products_get_by_category = async (req, res, next) => {
  try {
    const { category, categorySub } = req.query;
    let query = { category };

    if (categorySub) {
      query.categorySub = categorySub;
    }

    const products = await Product.find(query);
    res.status(200).json({
      message: "Products found",
      data: {
        count: products.length,
        products: products,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.products_get_one = (req, res, next) => {
  Product.findOne({ _id: req.params.id })
    .populate("shop")
    .exec()
    .then((response) => {
      res.status(200).json({
        message: "Product found",
        data: response,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.products_get_by_shop = async (req, res, next) => {
  try {
    const products = await Product.find({ shop: req.params.shopId });

    res.status(200).json({
      message: "Products found",
      products: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.products_search = async (req, res, next) => {
  try {
    const { name = "", category, categorySub } = req.query;
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (category) {
      query.category = category;
    }
    if (categorySub) {
      query.categorySub = categorySub;
    }

    const products = await Product.find(query);
    res.status(200).json({
      products: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.products_get_new = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.products_get_sale = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ sale: -1 }).limit(4);

    res.status(200).json({
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.products_get_recommend = async (req, res, next) => {
  try {
    const userId = req.userData ? req.userData : null;
    const recommendedProductIds = await recommendProducts(userId);

    const recommendedProducts = await Product.find({
      _id: { $in: recommendedProductIds },
    });
    res.status(200).json({
      products: recommendedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.products_delete = (req, res, next) => {
  Product.findById(req.params.id)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (req.shop && product.shop.toString() !== req.shop._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const deletePhotoPromises =
        product.files?.photos?.map((photoUrl) => {
          return new Promise((resolve, reject) => {
            const publicId = getPublicIdFromUrl(photoUrl);
            if (!publicId) {
              return reject(
                new Error(`Could not extract public_id from URL: ${photoUrl}`)
              );
            }
            cloudinary.uploader.destroy(publicId, (error, result) => {
              console.log(`Result from Cloudinary: `, result);
              if (error) {
                console.error(
                  `Error deleting photo with public_id ${publicId}: `,
                  error
                );
                reject(error);
              } else {
                console.log(
                  `Photo with public_id ${publicId} deleted successfully.`
                );
                resolve();
              }
            });
          });
        }) || [];

      const deleteVideoPromises = () => {
        return new Promise((resolve, reject) => {
          const publicId = getPublicIdFromUrl(product.files.video);
          if (!publicId) {
            console.error(`Invalid URL: ${product.files.video}`);
            return reject(new Error(`Invalid URL: ${product.files.video}`));
          }
          console.log(`URL: ${product.files.video}, Public ID: ${publicId}`);
          cloudinary.uploader.destroy(
            publicId,
            { resource_type: "video" },
            (error, result) => {
              console.log(`Result from Cloudinary: `, result);
              if (error) {
                console.error(
                  `Error deleting video with public_id ${publicId}: `,
                  error
                );
                reject(error);
              } else {
                console.log(
                  `Video with public_id ${publicId} deleted successfully.`
                );
                resolve();
              }
            }
          );
        });
      };

      return Promise.all([...deletePhotoPromises, deleteVideoPromises()])
        .then(() => {
          console.log("All delete promises have been resolved successfully.");
          return product.deleteOne();
        })
        .then(() => {
          res.status(200).json({
            message: "Product deleted",
          });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.products_update = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.shop && product.shop.toString() !== req.shop._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updateData = { ...req.body };

    if (req.files.photos) {
      const deletePhotoPromises = product.files.photos.map((photoUrl) => {
        return new Promise((resolve, reject) => {
          const publicId = getPublicIdFromUrl(photoUrl);
          console.log(`Public ID: ${publicId}`);
          if (!publicId) {
            return reject(
              new Error(`Could not extract public_id from URL: ${photoUrl}`)
            );
          }
          cloudinary.uploader.destroy(publicId, (error, result) => {
            console.log(`Result from Cloudinary: `, result);
            if (error) {
              return reject(error);
            } else {
              resolve();
            }
          });
        });
      });
      await Promise.all(deletePhotoPromises);

      const photoUploadPromises = req.files.photos.map(async (photo) => {
        try {
          console.log(`Uploading photo: ${photo.originalname}`);
          const photoId = shortid.generate();
          const result = await cloudinary.uploader.upload(photo.path, {
            public_id: `${product.name}_${photoId}`,
          });
          console.log(
            `Uploaded photo: ${photo.originalname}, URL: ${result.secure_url}`
          );
          await fs.promises.unlink(photo.path);
          return result.secure_url;
        } catch (err) {
          console.error(err);
          throw new Error("Invalid image file for photos");
        }
      });
      updateData["files.photos"] = await Promise.all(photoUploadPromises);
    }

    if (req.files.video && req.files.video.length > 0) {
      if (product.files.video) {
        const publicId = getPublicIdFromUrl(product.files.video);
        if (!publicId) {
          throw new Error(`Invalid URL: ${product.files.video}`);
        }
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      }

      const videoResult = await cloudinary.uploader.upload(
        req.files.video[0].path,
        {
          public_id: `${product.name}_video`,
          resource_type: "video",
        }
      );
      await fs.promises.unlink(req.files.video[0].path);
      updateData["files.video"] = videoResult.secure_url;
    }

    await Product.updateOne(
      { _id: req.params.id },
      { $set: updateData }
    ).exec();

    res.status(200).json({
      message: "Product updated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error,
    });
  }
};
