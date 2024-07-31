const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

async function createUserProductMatrix() {
  const users = await User.find({});
  const products = await Product.find({});
  const userProductMatrix = {};

  for (let user of users) {
    const userId = user._id.toString();
    userProductMatrix[userId] = {};
    for (let product of products) {
      userProductMatrix[userId][product._id.toString()] = 0;
    }
    const orders = await Order.find({ userId: user._id });
    for (let order of orders) {
      for (let item of order.items) {
        userProductMatrix[userId][item.productId.toString()] = 1;
      }
    }
  }

  return userProductMatrix;
}

async function findSimilarUsers(targetUserId, userProductMatrix) {
  const similarities = {};
  const targetUserVector = Object.values(userProductMatrix[targetUserId]);

  for (let userId in userProductMatrix) {
    if (userId !== targetUserId) {
      const userVector = Object.values(userProductMatrix[userId]);
      similarities[userId] = cosineSimilarity(targetUserVector, userVector);
    }
  }

  const sortedSimilarUsers = Object.entries(similarities).sort(
    (a, b) => b[1] - a[1]
  );
  return sortedSimilarUsers.slice(0, 10).map(([userId, similarity]) => userId); // lấy 10 người dùng tương tự nhất
}

exports.recommendProducts = async (userId) => {
  const userProductMatrix = await createUserProductMatrix();

  if (!userProductMatrix[userId]) {
    const popularProducts = await Product.find({})
      .sort({ rating: -1 })
      .limit(10);
    return popularProducts.map((product) => product._id.toString());
  }

  const similarUsers = await findSimilarUsers(userId, userProductMatrix);

  if (similarUsers.length === 0) {
    const popularProducts = await Product.find({})
      .sort({ rating: -1 })
      .limit(10);
    return popularProducts.map((product) => product._id.toString());
  }

  const recommendedProducts = {};

  for (let similarUserId of similarUsers) {
    for (let productId in userProductMatrix[similarUserId]) {
      if (
        userProductMatrix[similarUserId][productId] === 1 &&
        userProductMatrix[userId][productId] === 0
      ) {
        if (!recommendedProducts[productId]) {
          recommendedProducts[productId] = 0;
        }
        recommendedProducts[productId]++;
      }
    }
  }

  const sortedRecommendedProducts = Object.entries(recommendedProducts).sort(
    (a, b) => b[1] - a[1]
  );
  return sortedRecommendedProducts
    .slice(0, 10)
    .map(([productId, score]) => productId);
};
