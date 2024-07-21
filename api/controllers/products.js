const mongoose = require("mongoose");
const Product = require("../models/product");
const cloudinary = require("../untils/imageUpload");
const shortid = require("shortid");
const fs = require("fs");
const { getPublicIdFromUrl } = require("../untils/getPublicIdFromUrl");

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
      rating: req.body.rating,
      files: {
        photos: photoUrls,
        video: videoUrl,
      },
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

exports.products_get_all = (req, res, next) => {
  Product.find()
    .populate("shop")
    .exec()
    .then((response) => {
      res.status(200).json({
        message: "Products found",
        data: {
          count: response.length,
          products: response,
        },
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.products_get_one = (req, res, next) => {
  Product.find({ _id: req.params.id })
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
