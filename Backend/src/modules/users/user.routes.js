const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../core/middlewares/auth');
const { signup, signin, updateUser, getUsers, getProfile } = require('./user.controller');

router.post('/signup', signup);
router.post('/signin', signin);
router.put('/', authMiddleware, updateUser);
router.get('/bulk', authMiddleware, getUsers);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
