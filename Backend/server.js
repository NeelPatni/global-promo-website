import express from "express";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";

dotenv.config({ path: "config/config.env" });

const app = express();
const __dirname = path.resolve();

app.use(bodyParser.json());

// ✅ Setup CORS
app.use(
  cors({
    origin: "*", // allow all origins or specify your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Razorpay Routes
app.get("/api/get-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

app.post("/api/orders", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: Math.round(amount * 100),
      currency: "USD",
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({ error: "Order creation failed" });
  }
});

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

// ✅ Serve Frontend
app.use(express.static(path.join(__dirname, "Html"))); 

// Catch-all route to send index.html (for SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Html", "index.html")); 
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
