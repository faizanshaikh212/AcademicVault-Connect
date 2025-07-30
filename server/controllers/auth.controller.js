import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Check if user already exists with the same email or username
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists." });
    }

    // Create a new user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password, // Password will be hashed by the pre-save middleware in the model
    });

    if (user) {
      // If user is created successfully, send back user data and a token
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data." });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Server error during registration.",
        error: error.message,
      });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and if the password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings, // Send settings for theme preference on login
        token: generateToken(user._id),
      });
    } else {
      // Use a generic message to avoid revealing whether the email or password was wrong
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during login.", error: error.message });
  }
};

export { registerUser, loginUser };
