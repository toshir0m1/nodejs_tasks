const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');

const auth = require('../middleware/authentication');
const { User, userFields } = require('../models/user');

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!/\.(jpg|jpeg|png)$/i.test(file.originalname)) {
            return cb(new Error('Please upload only .jpg .jpeg or .png files.'));
        }
        cb(undefined, true);
    }
});

const router = new express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateToken();
        res.status(201).send({ user: user, token });
    } catch (e) {
        res.status(400).send(e);
    };
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateToken();
        res.status(200).send({ user: user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((t) => t.token !== req.token);
        await req.user.save();

        res.status(200).send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.status(200).send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user);
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const avatarImg = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    req.user.avatar = avatarImg;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => userFields.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update operation: all provided fields must already exist.'});
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);

        await req.user.save();
        res.status(200).send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();

        res.status(200).send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;