const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Webhook server running");
});

// Webhook
app.post("/webhook", async (req, res) => {
  try {
    console.log("================================");
    console.log("🔥 Incoming GoKwik Webhook:");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("================================");

    const data = req.body;

    // ✅ FIXED EXTRACTION
    const name =
      data.name ||
      data.customer?.name ||
      data.customer_name ||
      `${data.address?.firstname || ""} ${data.address?.lastname || ""}`.trim() ||
      "Unknown";

    const phone =
      data.phone ||
      data.mobile ||
      data.phone_number ||
      data.customer?.phone ||
      data.address?.phone ||   // 🔥 IMPORTANT
      null;

    const email =
      data.email ||
      data.customer_email ||
      data.customer?.email ||
      data.mapped_email ||
      "";

    console.log("👤 Name:", name);
    console.log("📞 Raw Phone:", phone);
    console.log("📧 Email:", email);

    // 🚫 Skip if no phone
    if (!phone) {
      console.log("❌ No phone number found, skipping...");
      return res.status(200).send("No phone, skipped");
    }

    // 🔥 Clean & format phone properly
let cleanPhone = phone.replace(/\D/g, ""); // remove +, spaces, etc

// Remove existing 91 if present
if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
  cleanPhone = cleanPhone.slice(2);
}

// Final format (always 91 + 10 digits)
const formattedPhone = `91${cleanPhone}`;

console.log("📞 Final Phone:", formattedPhone);

    // 📤 Send to Interakt
    const response = await axios.post(
      "https://api.interakt.ai/v1/public/track/users/",
      {
        phoneNumber: formattedPhone,
        traits: {
          name: name,
          email: email,
          source: "GoKwik Checkout",

          // 🔥 OPTIONAL EXTRA DATA
          cart_id: data.request_id,
          total_price: data.total_price,
          city: data.city,
          state: data.address?.state,
          product_name: data.items?.[0]?.product_title,
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
    console.log("📦 Interakt Response:", response.data);

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




// const express = require("express");
// const axios = require("axios");
// require("dotenv").config();

// const app = express();
// app.use(express.json());

// // Test route
// app.get("/", (req, res) => {
//   res.send("🚀 Webhook server running");
// });

// // GoKwik Webhook Endpoint
// app.post("/webhook", async (req, res) => {
//   try {
//     console.log("================================");
//     console.log("🔥 Incoming GoKwik Webhook:");
//     console.log(JSON.stringify(req.body, null, 2));
//     console.log("================================");

//     const data = req.body;

//     // 🔍 Flexible extraction (handles different payload formats)
//     const customer = {
//       name:
//         data.name ||
//         data.customer?.name ||
//         data.customer_name ||
//         "Unknown",

//       phone:
//         data.phone ||
//         data.mobile ||
//         data.phone_number ||
//         data.customer?.phone,

//       email:
//         data.email ||
//         data.customer_email ||
//         data.customer?.email ||
//         "",
//     };

//     // 🚫 Skip if no phone (Interakt requires phone)
//     if (!customer.phone) {
//       console.log("❌ No phone number found, skipping...");
//       return res.status(200).send("No phone, skipped");
//     }

//     console.log("✅ Extracted Customer:", customer);

//     // 📤 Send data to Interakt
//     await axios.post(
//       "https://api.interakt.ai/v1/public/track/users/",
//       {
//         phoneNumber: customer.phone,
//         traits: {
//           name: customer.name,
//           email: customer.email,
//           source: "GoKwik Checkout",
//         },
//       },
//       {
//         headers: {
//           Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ Sent to Interakt successfully");

//     res.status(200).send("Webhook processed");
//   } catch (error) {
//     console.error("❌ Error:", error.response?.data || error.message);
//     res.status(500).send("Error");
//   }
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });