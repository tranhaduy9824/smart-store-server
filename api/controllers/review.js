const Product = require("../models/product");
const User = require("../models/user");
const Review = require("../models/review");

exports.review_add = async (req, res, next) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let review = await Review.findOne({ productId });
    if (!review) {
      review = new Review({
        productId,
        items: [
          {
            userId,
            rating,
            comment,
          },
        ],
      });
      await review.save();
    } else {
      const existingReview = review.items.find(
        (item) => item.userId.toString() === userId
      );

      if (existingReview) {
        return res.status(200).json({
          message: "Review already exists",
        });
      } else {
        review.items.push({
          userId,
          rating,
          comment,
        });
      }

      await review.save();
    }

    res.status(200).json({
      message: "Review added successfully",
      review: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.review_get_product = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).populate(["items.userId"]);
    res.status(200).json({
      message: "Reviews get successfully",
      reviews: reviews,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.review_update = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    const reviewItem = review.items.find(
      (item) => item.userId.toString() === userId.toString()
    );
    if (!reviewItem) {
      return res.status(404).json({
        message: "User review not found",
      });
    }

    reviewItem.rating = rating;
    reviewItem.comment = comment;
    await review.save();

    res.status(200).json({
      message: "Review updated successfully",
      review: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.review_delete = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    const userReviewIndex = review.items.findIndex(
      (item) => item.userId.toString() === userId.toString()
    );
    if (userReviewIndex === -1) {
      return res.status(404).json({
        message: "User review not found",
      });
    }

    review.items.splice(userReviewIndex, 1);
    await review.save();

    res.status(200).json({
      message: "Review deleted successfully",
      review: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
