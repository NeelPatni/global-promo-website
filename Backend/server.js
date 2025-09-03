import express from "express";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from "crypto";

dotenv.config({ path: "config/config.env" });

const app = express();
app.use(bodyParser.json());

// ✅ Setup CORS (Frontend URL must be allowed)
app.use(
  cors({
    origin: "https://global-promo-website.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  })
);


// Handle OPTIONS for preflight
app.use(cors()); // applies CORS to all routes

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Get Razorpay Key
app.get("/api/get-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// ✅ Create Order (USD fix)
app.post("/api/orders", async (req, res) => {
  try {
    const { amount } = req.body; // amount in dollars from frontend

    const options = {
      amount: Math.round(amount * 100), // ✅ convert to cents
      currency: "USD",
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ✅ Verify Payment
app.post("/api/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
