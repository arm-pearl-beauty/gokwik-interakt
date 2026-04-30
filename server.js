const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Webhook server running");
});

// GoKwik Webhook Endpoint
app.post("/webhook", async (req, res) => {
  try {
    console.log("================================");
    console.log("🔥 Incoming GoKwik Webhook:");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("================================");

    const data = req.body;

    // 🔍 Flexible extraction (handles different payload formats)
    const customer = {
      name:
        data.name ||
        data.customer?.name ||
        data.customer_name ||
        "Unknown",

      phone:
        data.phone ||
        data.mobile ||
        data.phone_number ||
        data.customer?.phone,

      email:
        data.email ||
        data.customer_email ||
        data.customer?.email ||
        "",
    };

    // 🚫 Skip if no phone (Interakt requires phone)
    if (!customer.phone) {
      console.log("❌ No phone number found, skipping...");
      return res.status(200).send("No phone, skipped");
    }

    console.log("✅ Extracted Customer:", customer);

    // 📤 Send data to Interakt
    await axios.post(
      "https://api.interakt.ai/v1/public/track/users/",
      {
        phoneNumber: customer.phone,
        traits: {
          name: customer.name,
          email: customer.email,
          source: "GoKwik Checkout",
        },
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