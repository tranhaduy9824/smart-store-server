const express = require('express');
const router = express.Router();

const UsersController = require('../controllers/users');

router.post("/signup", UsersController.users_signup);

router.post("/login", UsersController.users_login);

router.post("/facebook-login", UsersController.facebook_login);

router.post("/google-login", UsersController.google_login);

module.exports = router;
