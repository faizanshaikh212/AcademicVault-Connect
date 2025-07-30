import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

/**
 * @desc    Get or create a one-on-one chat
 * @route   POST /api/chats
 * @access  Private
 */
const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "UserId param not sent with request" });
  }

  // Find if a chat between the two users already exists
  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { participants: { $elemMatch: { $eq: req.user._id } } },
      { participants: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("participants", "-password")
    .populate("lastMessage");

  isChat = await User.populate(isChat, {
    path: "lastMessage.sender",
    select: "username profile.avatar email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // If no chat exists, create a new one
    const chatData = {
      chatName: "sender", // Not used for 1-on-1 chats, but good to have
      isGroupChat: false,
      participants: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "participants",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * @desc    Fetch all chats for a user
 * @route   GET /api/chats
 * @access  Private
 */
const fetchChats = async (req, res) => {
  try {
    Chat.find({ participants: { $elemMatch: { $eq: req.user._id } } })
      .populate("participants", "-password")
      .populate("groupInfo.admin", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "lastMessage.sender",
          select: "username profile.avatar email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Create a new group chat
 * @route   POST /api/chats/group
 * @access  Private
 */
const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  // The current user is also a participant
  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      isGroupChat: true,
      participants: users,
      groupInfo: {
        name: req.body.name,
        admin: req.user,
      },
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("participants", "-password")
      .populate("groupInfo.admin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Get all messages for a chat
 * @route   GET /api/chats/:chatId/messages
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username profile.avatar email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { accessChat, fetchChats, createGroupChat, getMessages };
