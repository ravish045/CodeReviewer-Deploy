require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require('./models/User');
const History = require('./models/History');
const authMiddleware = require('./middleware/auth');

const app = express();

/* =========================
   🔧 MIDDLEWARE
========================= */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(passport.initialize());

/* =========================
   ✅ MongoDB
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

/* =========================
   🔐 GOOGLE AUTH CONFIG
========================= */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

/* =========================
   🔐 AUTH ROUTES
========================= */

// Register
app.post("/api/register", async (req, res) => {
  const bcrypt = require("bcryptjs");
  const { email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed });

    res.json({ message: "User registered successfully" });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const bcrypt = require("bcryptjs");
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

/* =========================
   🔥 GOOGLE ROUTES
========================= */

// Start Google login
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback
app.get("/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET);

    // 🔥 IMPORTANT (use localhost for now)
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

app.get("/api/me", authMiddleware, async (req, res) => {
  if (!req.user) return res.json(null);

  const user = await User.findById(req.user.id).select("email");
  res.json(user);
});

/* =========================
   🤖 CODE REVIEW
========================= */
app.post('/api/review', authMiddleware, async (req, res) => {
  const { code, language } = req.body;

  if (!code) return res.status(400).json({ error: "No code provided" });

  const prompt = `
You are a Senior Code Reviewer.
Return ONLY JSON.

{
  "status": "Grade",
  "summary": "Short explanation",
  "details": ["point1", "point2"],
  "optimizedCode": "corrected code"
}

Code:
${code}
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;

    let parsed;
    try {
      const json = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      parsed = JSON.parse(json);
    } catch {
      return res.json({
        status: "Error",
        summary: "AI formatting issue",
        details: [text.slice(0, 200)],
        optimizedCode: ""
      });
    }

    if (req.user) {
      await History.create({
        userId: req.user.id,
        code,
        result: parsed
      });
    }

    res.json(parsed);

  } catch (err) {
    console.error("❌ AI Error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI request failed" });
  }
});

/* =========================
   📜 HISTORY
========================= */
app.get("/api/history", authMiddleware, async (req, res) => {
  if (!req.user) return res.json([]);

  const history = await History.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.json(history);
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});