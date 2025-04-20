const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.model.js");
const { sanitizeUser } = require("./services/common");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true, // Allow requests from any origin during development
  credentials: true, // Allow cookies to be sent with requests
}));

// Middleware
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: "50mb" })); // To parse req.body

// Passport Strategies
passport.use(
  "local",
  new LocalStrategy({ usernameField: "email" }, async function verify(
    email,
    password,
    done
  ) {
    try {
      const user = await User.findOne({ email: email }).exec();

      if (!user) {
        return done(null, false, { message: "Invalid credentials" });
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async (err, hashedPassword) => {
          if (err) return done(err);
          try {
            if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
              return done(null, false, { message: "Invalid credentials" });
            }
            const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET);
            user.token = token;
            return done(null, sanitizeUser(user));
          } catch (error) {
            console.error("Authentication error:", error);
            return done(error);
          }
        }
      );
    } catch (error) {
      console.error("User lookup error:", error);
      return done(error);
    }
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// Create admin user if it doesn't exist
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const salt = crypto.randomBytes(16);
      crypto.pbkdf2(
        "admin123", // Default admin password
        salt,
        310000,
        32,
        "sha256",
        async (err, hashedPassword) => {
          if (err) {
            console.error("Error creating admin:", err);
            return;
          }
          try {
            const admin = new User({
              email: "admin@example.com",
              password: hashedPassword,
              salt,
              name: "Admin User",
              role: "admin"
            });
            await admin.save();
            console.log("Admin user created successfully");
          } catch (error) {
            console.error("Error saving admin:", error);
          }
        }
      );
    } else {
      console.log("Admin account already exists");
    }
  } catch (error) {
    console.error("Error checking/creating admin:", error);
  }
};

// Routes
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      password,
      salt,
      310000,
      32,
      "sha256",
      async (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: "Error creating user" });
        }
        const user = new User({
          email,
          password: hashedPassword,
          salt,
          name,
        });

        try {
          await user.save();
          res.status(201).json({ success: true, message: "User created successfully" });
        } catch (error) {
          if (error.code === 11000) {
            // Handle duplicate email error
            res.status(400).json({ error: "Email already exists" });
          } else {
            console.error("Error saving user:", error);
            res.status(500).json({ error: "Error creating user" });
          }
        }
      }
    );
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ error: "Error creating user" });
  }
});

app.post("/api/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: "Authentication error" });
    }
    if (!user) {
      return res.status(401).json({ error: info.message || "Invalid credentials" });
    }
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login error" });
      }
      const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      });
    });
  })(req, res, next);
});

// Current user endpoint
app.get("/api/auth/me", (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
  return res.status(401).json({ success: false, message: "Not authenticated" });
});

// Test route to verify API is working
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Database connection
main().catch((err) => console.log(err));

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected");
    
    // Create admin user after successful DB connection
    await createAdminUser();
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server is started on port ${process.env.PORT}`);
});
