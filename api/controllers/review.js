const Product = require("../models/product");
const User = require("../models/user");
const Review = require("../models/review");
const Order = require("../models/order");

exports.review_add = async (req, res, next) => {
  try {
    const { userId } = req.userData;
    const { productId, orderId, rating, comment } = req.body;

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

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    let review = await Review.findOne({
      productId,
      "items.userId": userId,
      "items.orderId": orderId,
    });

    if (review) {
      return res.status(400).json({
        message: "You have already reviewed this product in this order.",
      });
    }

    review = await Review.findOne({ productId });

    if (!review) {
      review = new Review({
        productId,
        items: [
          {
            userId,
            orderId,
            rating,
            comment,
          },
        ],
      });
    } else {
      review.items.push({
        userId,
        orderId,
        rating,
        comment,
      });
    }

    await review.save();

    const reviews = await Review.find({ productId });
    const totalRatings = reviews.reduce((acc, review) => {
      return (
        acc + review.items.reduce((subAcc, item) => subAcc + item.rating, 0)
      );
    }, 0);

    const numberOfRatings = reviews.reduce(
      (acc, review) => acc + review.items.length,
      0
    );
    const averageRating = numberOfRatings ? totalRatings / numberOfRatings : 5;

    await Product.findByIdAndUpdate(productId, {
      rating: averageRating,
      numberRating: numberOfRatings,
    });

    res.status(200).json({
      message: "Review added successfully",
      review: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.review_get_by_shop = async (req, res, next) => {
  try {
    const shopId = req.shop._id;

    const products = await Product.find({ shop: shopId }).select('_id');
    if (!products.length) {
      return res.status(404).json({
        message: "No products found for this shop.",
      });
    }

    const productIds = products.map(product => product._id);
    const reviews = await Review.find({ productId: { $in: productIds } }).populate('productId items.userId');

    res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews: reviews,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};


exports.review_get_by_product = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.findOne({ productId }).populate([
      "items.userId",
    ]);

    res.status(200).json({
      message: "Reviews get successfully",
      reviews: reviews,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.review_get_by_order = async (req, res, next) => {
  try {
    const { userId } = req.userData;
    const { orderId } = req.params;

    const reviewData = await Review.find({
      "items.orderId": orderId,
      "items.userId": userId,
    });

    if (reviewData.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    const formattedReviews = reviewData.map((review) => {
      const userReview = review.items.find(
        (item) => item.userId._id.toString() === userId
      );

      return {
        orderId,
        productId: review.productId,
        rating: userReview.rating,
        comment: userReview.comment,
      };
    });

    res.status(200).json({
      message: "Review retrieved successfully",
      review: formattedReviews,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.review_update = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const { userId } = req.userData;

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
    const { userId } = req.userData;

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
