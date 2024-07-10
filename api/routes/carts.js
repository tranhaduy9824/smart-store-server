const express = require('express');
const router = express.Router();

const CartsController = require('../controllers/carts');

router.post('/', CartsController.carts_add);
router.get('/:id', CartsController.carts_get);
router.patch('/', CartsController.carts_update);
router.delete('/', CartsController.carts_remove);

module.exports = router;