const express = require('express');
const router = express.Router();
const multer = require('multer');

const UsersController = require('../controllers/users');
const checkAuth = require('../middleware/check-auth')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter
})

router.post("/signup", UsersController.users_signup);
router.post("/login", UsersController.users_login);
router.post("/facebook-login", UsersController.facebook_login);
router.post("/google-login", UsersController.google_login);
router.post("/forgot-password", UsersController.forgot_password);
router.post("/reset-password/:id/:token", UsersController.reset_password);
router.post("/update-avatar", upload.single('avatar'), checkAuth, UsersController.update_avatar)

module.exports = router;
