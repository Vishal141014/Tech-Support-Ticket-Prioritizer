const express = require("express");
const passport = require("passport");
const {
  createUser,
  loginUser,
  checkAuth,
} = require("../controller/Auth.controller");
const router = express.Router();

router
  .post("/signup", createUser)
  .post("/login", passport.authenticate("local"), loginUser)
  .get("/check", passport.authenticate("jwt"), checkAuth);

exports.router = router;
