const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const { validateSignup, validateLogin } = require("../middleware/userValidator");

router.post('/signup', validateSignup, userCtrl.signup);
router.post('/login', validateLogin, userCtrl.login);

module.exports = router;