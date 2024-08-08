const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return normA && normB ? dotProduct / (normA * normB) : 0;
}

async function createUserProductMatrix() {
  const users = await User.find({}).lean();
  const products = await Product.find({}).lean();
  const userProductMatrix = {};

  users.forEach((user) => {
    userProductMatrix[user._id.toString()] = {};
    products.forEach((product) => {
      userProductMatrix[user._id.toString()][product._id.toString()] = 0;
    });
  });

  const orders = await Order.find({}).lean();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const userId = order.userId.toString();
      const productId = item.productId.toString();
      if (userProductMatrix[userId]) {
        userProductMatrix[userId][productId] = 1;
      }
    });
  });

  return userProductMatrix;
}

async function findSimilarUsers(targetUserId, userProductMatrix) {
  const similarities = {};
  const targetUserVector = Object.values(userProductMatrix[targetUserId] || {});

  for (let userId in userProductMatrix) {
    if (userId !== targetUserId) {
      const userVector = Object.values(userProductMatrix[userId]);
      similarities[userId] = cosineSimilarity(targetUserVector, userVector);
    }
  }

  const sortedSimilarUsers = Object.entries(similarities).sort(
    (a, b) => b[1] - a[1]
  );
  return sortedSimilarUsers.slice(0, 10).map(([userId]) => userId);
}

exports.recommendProducts = async (userId) => {
  try {
    const userProductMatrix = await createUserProductMatrix();

    if (!userProductMatrix[userId]) {
      const popularProducts = await Product.find({})
        .sort({ rating: -1 })
        .limit(10)
        .lean();
      return popularProducts.map((product) => product._id.toString());
    }

    const similarUsers = await findSimilarUsers(userId, userProductMatrix);

    if (similarUsers.length === 0) {
      const popularProducts = await Product.find({})
        .sort({ rating: -1 })
        .limit(10)
        .lean();
      return popularProducts.map((product) => product._id.toString());
    }

    const recommendedProducts = {};

    for (let similarUserId of similarUsers) {
      if (userProductMatrix[similarUserId]) {
        for (let productId in userProductMatrix[similarUserId]) {
          if (
            userProductMatrix[similarUserId][productId] === 1 &&
            userProductMatrix[userId] &&
            userProductMatrix[userId][productId] === 0
          ) {
            if (!recommendedProducts[productId]) {
              recommendedProducts[productId] = 0;
            }
            recommendedProducts[productId]++;
          }
        }
      }
    }

    const sortedRecommendedProducts = Object.entries(recommendedProducts).sort(
      (a, b) => b[1] - a[1]
    );
    const topRecommendedProductIds = sortedRecommendedProducts
      .slice(0, 10)
      .map(([productId]) => productId);

    return topRecommendedProductIds.length > 0 ? topRecommendedProductIds : [];
  } catch (error) {
    console.error("Error in recommendProducts:", error);
    throw error;
  }
};
