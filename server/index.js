require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Middlewares
const authenticate = require("./middleware/authenticate");

// Routers
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const transactionsRouter = require("./routes/transactions");
const settingsRouter = require("./routes/settings");
const recurringRouter = require("./routes/recurring");

const app = express();
app.use(cors());
app.use(express.json());

// DB connect
connectDB();

// Public routes
app.use("/auth", authRouter);

// Protected routes
app.use("/api/profile", authenticate, profileRouter);
app.use("/api/transactions", authenticate, transactionsRouter);
app.use("/api/settings", authenticate, settingsRouter);
app.use("/api/recurring", authenticate, recurringRouter);

// Health check
app.get("/health", (req, res) => res.json({ ok: true, status: "healthy" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server is running at http://localhost:${PORT}`)
);
