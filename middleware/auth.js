const jwt = require('jsonwebtoken');
const { User, Counter } = require('../models/AllCollection');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('==>decoded', decoded);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

const getNextSequence = async (name) => {
    const counter = await Counter.findOneAndUpdate(
        { name },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
    );
    return counter.value;
};

module.exports = auth;
module.exports = getNextSequence;