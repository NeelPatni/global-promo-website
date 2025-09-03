import express from "express";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Load environment variables
dotenv.config({ path: "config/config.env" });

const app = express();

// ✅ Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(bodyParser.json());

// ✅ CORS (since frontend & backend are on same origin, this is optional)
app.use(
  cors({
    origin: "https://global-promo-website.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ API Routes

// Get Razorpay key
app.get("/api/get-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// Create order
app.post("/api/orders", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const options = {
      amount: Math.round(Number(amount) * 100), // smallest currency unit
      currency: "USD",
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// Verify payment
app.post("/api/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// ✅ Serve frontend
app.use(express.static(path.join(__dirname, "../Html")));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../Html/index.html"));
});


// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
