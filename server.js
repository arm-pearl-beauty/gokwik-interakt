const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Webhook server running successfully");
});

// Webhook route
app.post("/webhooks/checkout", async (req, res) => {
  try {
    console.log("================================");
    console.log("New GoKwik webhook received");
    console.log("================================");

    console.log(JSON.stringify(req.body, null, 2));

    const data = req.body;

    //-----------------------
    // PHONE
    //-----------------------
    const phone =
      data.phone ||
      data.customer_phone ||
      data.customer?.phone ||
      data.checkout?.phone;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone missing"
      });
    }

    // Remove special characters
    let cleanedPhone = phone.toString().replace(/\D/g, "");

    // Take only last 10 digits
    let last10Digits = cleanedPhone.slice(-10);

    console.log("Original Phone:", phone);
    console.log("Final Phone for Interakt:", last10Digits);

    //-----------------------
    // NAME
    //-----------------------
    let name =
      data.name ||
      data.customer_name ||
      data.customer?.name ||
      `${data.customer?.firstname || ""} ${data.customer?.lastname || ""}`.trim();

    if (!name || name.trim() === "") {
      name = "Customer";
    }

    console.log("Final Name:", name);

    //-----------------------
    // EMAIL
    //-----------------------
    const email =
      data.email ||
      data.customer?.email ||
      data.customer_email ||
      "";

    //-----------------------
    // PRODUCT DETAILS
    //-----------------------
    const productName =
      data.line_items?.[0]?.title ||
      data.product_name ||
      "Product";

    const quantity =
      data.line_items?.[0]?.quantity ||
      1;

    //-----------------------
    // CART DETAILS
    //-----------------------
    const amount =
      data.total_price ||
      data.amount ||
      data.final_price ||
      0;

    const cartId =
      data.id ||
      data.cart_id ||
      "";

    const cartLink =
      data.abc_link ||
      data.checkout_url ||
      "";

    //-----------------------
    // UTM DETAILS
    //-----------------------
    const utmSource =
      data.utm_source ||
      data.source ||
      "";

    const utmCampaign =
      data.utm_campaign ||
      "";

    const utmMedium =
      data.utm_medium ||
      "";

    //-----------------------
    // DROP OFF STAGE
    //-----------------------
    const dropOffStage =
      data.drop_off_stage ||
      data.checkout_stage ||
      "";

    console.log("Final extracted data:");
    console.log({
      phone: last10Digits,
      name,
      email,
      productName,
      quantity,
      amount,
      cartId,
      cartLink,
      utmSource,
      utmCampaign,
      utmMedium,
      dropOffStage
    });

    //------------------------------------
    // Send data to Interakt
    //------------------------------------
    const payload = {
      userId: cartId,
      phoneNumber: last10Digits,
      countryCode: "+91",

      traits: {
        name: name,
        email: email,
        product_name: productName,
        quantity: quantity,
        amount: amount,
        cart_id: cartId,
        cart_link: cartLink,
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        utm_medium: utmMedium,
        drop_off_stage: dropOffStage
      }
    };

    console.log("Sending payload to Interakt:");
    console.log(JSON.stringify(payload, null, 2));

    const interaktResponse = await axios.post(
      "https://api.interakt.ai/v1/public/track/users/",
      payload,
      {
        headers: {
          Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Interakt response:");
    console.log(interaktResponse.data);

    res.status(200).json({
      success: true,
      message: "Abandoned cart data sent successfully"
    });

  } catch (error) {
    console.log("Webhook error:");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    res.status(500).json({
      success: false,
      error: "Webhook failed"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});