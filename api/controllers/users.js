const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.users_signup = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                if ((user.loginType.includes('facebook')) || (user.loginType.includes('google'))) {
                    bcrypt.hash(req.body.password, 10, (err, hash) => {
                        if (err) {
                            return res.status(500).json({
                                error: err
                            });
                        } else {
                            user.password = hash;
                            if (!user.loginType.includes('email')) {
                                user.loginType.push('email');
                            }
                            user.save()
                                .then((result) => {
                                    console.log(result);
                                    res.status(200).json({
                                        message: 'Password and email updated'
                                    });
                                })
                                .catch((err) => {
                                    console.log(err);
                                    res.status(500).json({
                                        error: err
                                    });
                                });
                        }
                    });
                } else {
                    return res.status(409).json({
                        message: 'Email exists',
                    });
                }
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                            error: err
                        });
                    } else {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            fullname: req.body.fullname,
                            email: req.body.email,
                            password: hash,
                            loginType: ['email']
                        });
                        user.save()
                            .then((result) => {
                                console.log(result);
                                res.status(201).json({
                                    message: 'User created'
                                });
                            })
                            .catch((err) => {
                                console.log(err);
                                res.status(500).json({
                                    error: err
                                })
                            })
                    }
                })
            }
        })
}

exports.users_login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res.status(401).json({
                    message: "Auth failed"
                })
            }
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: "Auth failed"
                    })
                }
                if (result) {
                    const token = jwt.sign(
                        {
                            email:  user.email,
                            userId: user._id
                        },
                        process.env.JWT_KEY,
                        {
                            expiresIn: "1h" 
                        }
                    );
                    return res.status(200).json({
                        message: "Auth successful",
                        token: token
                    });
                }
                return res.status(401).json({
                    message: "Auth failed"
                })
            })
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
}

exports.facebook_login = (req, res, next) => {
    const { email, name } = req.body;

    const userEmail = email || `noemail_${new mongoose.Types.ObjectId()}@facebook.com`

    User.findOne({ email: userEmail })
        .then(user => {
            if (!user) {
                const newUser = new User({
                    _id: new  mongoose.Types.ObjectId(),
                    fullname: name,
                    email: userEmail,
                    password: null,
                    loginType: ['facebook']
                });
                return newUser.save();
            } else {
                user.fullname = name;
                if (!user.loginType.includes('facebook')) {
                    user.loginType.push('facebook');
                }
                return user.save();
            }
        })
        .then(savedUser => {
            const token = jwt.sign(
                {
                    email: savedUser.email,
                    userId: savedUser._id
                },
                process.env.JWT_KEY,
                {
                    expiresIn: '1h'
                }
            );
            res.status(200).json({
                message: 'Auth successful',
                token: token
            })
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
}

exports.google_login = (req, res, next) => {
    const { email, name } = req.body; 

    const userEmail = email || `noemail_${new mongoose.Types.ObjectId()}@google.com`

    User.findOne({ email: userEmail })
        .then(user => {
            if (!user) {
                const newUser = new User({
                    _id: new mongoose.Types.ObjectId(),
                    fullname: name,
                    email: userEmail,
                    password: null,
                    loginType: ['google']
                })
                return newUser.save();
            } else {
                user.fullname = name;
                if (!user.loginType.includes('google')) {
                    user.loginType.push('google');
                }
                return user.save();
            }
        })
        .then(savedUser => {
            const token = jwt.sign(
                {
                    email: savedUser.email,
                    userId: savedUser._id
                },
                process.env.JWT_KEY,
                {
                    expiresIn: '1h'
                }
            );
            res.status(200).json({
                message: 'Auth successful',
                token: token
            })
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
}