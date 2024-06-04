const express = require('express');
const router = express.Router();

const UsersController = require('../controllers/users');

router.post("/signup", UsersController.users_signup);
router.post("/login", UsersController.users_login);
router.post("/facebook-login", UsersController.facebook_login);
router.post("/google-login", UsersController.google_login);
router.post("/forgot-password", UsersController.forgot_password);
router.post("/reset-password/:id/:token", UsersController.reset_password);

module.exports = router;
