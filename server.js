const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Parse JSON
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Webhook server running successfully");
});

// GoKwik webhook route
app.post("/webhooks/checkout", async (req, res) => {
  try {
    console.log("================================");
    console.log("New GoKwik webhook received");
    console.log("================================");

    const data = req.body;

    console.log("Webhook Payload:");
    console.log(JSON.stringify(data, null, 2));

    // Send user data to Interakt
    const interaktResponse = await axios.post(
      "https://api.interakt.ai/v1/public/track/users/",
      {
        userId: data.phone,
        phoneNumber: data.phone,
        countryCode: "+91",

        traits: {
          name: data.name || "",
          email: data.email || "",
          checkout_id: data.id || "",
          total_price: data.total_price || "",
          payment_method: data.payment_method || "",
          city: data.shipping_address?.city || "",
          state: data.shipping_address?.province || "",
          product_name: data.line_items?.[0]?.title || ""
        },

        tags: ["Abandoned Checkout"]
      },
      {
        headers: {
          Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("User data successfully sent to Interakt:");
    console.log(interaktResponse.data);

    res.status(200).json({
      success: true,
      message: "User data sent to Interakt successfully"
    });

  } catch (error) {
    console.error("Error sending data to Interakt:");
    console.log(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});