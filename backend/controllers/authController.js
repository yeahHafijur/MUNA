const jwt = require("jsonwebtoken");
const User = require('../models/User');
const bcrypt = require("bcryptjs");


const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Please fill all the Details"
        });
    }
    const userExists = await User.findOne({
        email: email
    });
    if (userExists) {
        return res.status(400).json({
            message: "User already exists with this email"
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "customer"
    });
    if (user) {
        res.status(201).json({
            message: "User registered successfully",
            _id: user.id,
            name: user.name,
            email: user.email
        });
    } else {
        res.status(400).json({
            message: "Invalid user data"
        });
    }

}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "please enter valid email and password"
        });

    }
    const user = await User.findOne({
        email: email
    });
    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        });

    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).json({
            message: "Invalid email or password"
        });

    }
    else {
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );
        res.status(200).json({
            message: "Login successful!",
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token
        });
    }

}


module.exports = { registerUser, loginUser };
