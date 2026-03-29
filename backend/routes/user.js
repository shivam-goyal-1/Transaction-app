const express = require("express");

const router = express.Router();

const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

const { authmiddleware } = require("../middleware");

const signupbody = zod.object({
  username: zod.string().email(),
  firstname: zod.string(),
  lastname: zod.string(),
  password: zod.string(),
});

const signinbody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

const updatebody = zod.object({
  firstname: zod.string(),
  lastname: zod.string(),
  password: zod.string(),
});

router.post("/signup", async (req, res) => {
  console.log("signup request body ", req.body);
  const { success } = signupbody.safeParse(req.body);

  if (!success) {
    return res.status(411).json({
      message: "incorrect inputs",
    });
  }
  const existingUser = await User.findOne({
    username: req.body.username,
  });
  if (existingUser) {
    return res.status(411).json({
      message: "username already exists",
    });
  }

  //if correct inputs and not already present, create new user
  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  });
  const userid = user._id;

  await Account.create({
    userid,
    balance: 1 + Math.random() * 10000,
  });

  const token = jwt.sign({ userid }, JWT_SECRET);
  res.json({
    message: "user created successfully ",
    token: token,
  });
});

router.post("/signin", async (req, res) => {
  const { success } = signinbody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "invalid inputs",
    });
  }

  const userexists = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (userexists) {
    const token = jwt.sign(
      {
        userid: userexists._id,
      },
      JWT_SECRET,
    );
    res.json({
      token: token,
    });
    return;
  }
  res.status(411).json({
    message: "user not found",
  });
});

router.put("/update", authmiddleware, async (req, res) => {
  const { success } = updatebody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "error while updating information",
    });
  }
  await User.updateOne({ _id: req.userId }, req.body);
  res.json({
    message: "updated successfully ",
  });
});

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstname: {
          $regex: filter,
        },
      },
      {
        lastname: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      _id: user._id,
    })),
  });
});

module.exports = router;
