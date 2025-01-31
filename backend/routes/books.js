const express = require('express');
const router = express.Router();
const bookCtrl = require('../controllers/books')
const auth = require('../middleware/auth');

const multer = require('../middleware/multer-config');

router.post('/', auth, multer, bookCtrl.createBook);
router.post('/:id/rating', auth, bookCtrl.ratingBook);
router.get('/bestrating', bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);
router.get('/', bookCtrl.getAllBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;