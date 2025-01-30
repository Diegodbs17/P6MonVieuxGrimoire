const express = require('express');
const router = express.Router();
const bookCtrl = require('../controllers/books')
const auth = require('../middleware/auth');

router.post('/', auth, bookCtrl.createBook);
router.get('/:id', auth, bookCtrl.getOneBook);
router.get('/', auth, bookCtrl.getAllBook);
router.put('/:id', auth, bookCtrl.modifyThing);
router.delete('/:id', auth, bookCtrl.deleteThing);

module.exports = router;