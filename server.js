const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

// ✅ Handle all payload types
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 Log every request (debugging)
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  console.log("📩 HEADERS:", req.headers);
  console.log("📩 METHOD:", req.method);
  console.log("📩 URL:", req.url);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Webhook server running");
});

// 🔧 Phone formatter (VERY IMPORTANT)
const formatPhone = (phone) => {
  if (!phone) return null;

  let clean = phone.toString().replace(/\D/g, "");

  // Only last 10 digits
  return clean.slice(-10);
};

// GoKwik Webhook Endpoint
app.post("/webhook", async (req, res) => {
  try {
    console.log("================================");
    console.log("🔥 Incoming GoKwik Webhook:");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("================================");

    const data = req.body;

    // 🔍 Extract customer
    const customer = {
      name:
        data.name ||
        data.customer?.name ||
        data.customer_name ||
        "Unknown",

      phone: formatPhone(
        data.phone ||
          data.mobile ||
          data.phone_number ||
          data.customer?.phone
      ),

      email:
        data.email ||
        data.customer_email ||
        data.customer?.email ||
        "",
    };

    if (!customer.phone) {
      console.log("❌ No phone number found, skipping...");
      return res.status(200).send("No phone, skipped");
    }

    console.log("✅ Extracted Customer:", customer);

    // 🔥 Extract ALL useful data
    const traits = {
      name: customer.name,
      email: customer.email,
      source: "GoKwik Checkout",

      // 📊 Marketing (IMPORTANT for ig/fb)
      utm_source:
        data.utm_source ||
        data.utm?.source ||
        data.marketing?.utm_source ||
        "direct",

      utm_medium:
        data.utm_medium ||
        data.utm?.medium ||
        data.marketing?.utm_medium ||
        "",

      utm_campaign:
        data.utm_campaign ||
        data.utm?.campaign ||
        data.marketing?.utm_campaign ||
        "",

      // 💰 Cart info
      cart_value:
        data.amount ||
        data.cart_value ||
        data.total_price ||
        "",

      currency: data.currency || "INR",

      // 📍 Drop stage
      drop_stage:
        data.drop_off_stage ||
        data.stage ||
        data.checkout_stage ||
        "",

      // 🆔 Cart ID
      cart_id: data.id || data.cart_id || "",

      // 📦 Items (stringified)
      items: JSON.stringify(
        data.items ||
          data.line_items ||
          data.products ||
          []
      ),
    };

    console.log("📦 Final Traits:", traits);

    // 📤 Send to Interakt
    await axios.post(
      "https://api.interakt.ai/v1/public/track/users/",
      {
        phoneNumber: customer.phone,
        traits: traits,
      },
      {
        headers: {
          Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Sent to Interakt successfully");

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(500).send("Error");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});