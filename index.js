const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let accessToken = "";

// Fetch a new access token
const getAccessToken = async () => {
  try {
    const credentials = `${process.env.PESAPAL_CONSUMER_KEY}:${process.env.PESAPAL_CONSUMER_SECRET}`;
    const encoded = Buffer.from(credentials).toString("base64");

    const response = await axios.get(
      "https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken",
      {
        headers: {
          Authorization: `Basic ${encoded}`,
          "Content-Type": "application/json",
        },
      }
    );

    accessToken = response.data.token;
    console.log("Access token fetched.");
  } catch (error) {
    console.error("Error fetching access token:", error.response?.data || error.message);
    throw new Error("Failed to get access token");
  }
};

// STK Push Endpoint
app.post("/stk-push", async (req, res) => {
  const { phone, amount } = req.body;

  try {
    await getAccessToken(); // Always refresh token

    const orderDetails = {
      amount,
      currency: "KES",
      description: "Test M-PESA Payment",
      callback_url: "https://example.com/callback", // Update this for production
      billing_address: {
        phone_number: phone,
        email_address: "client@example.com",
        country_code: "KE",
        first_name: "Customer",
        last_name: "One",
      },
    };

    const response = await axios.post(
      "https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest",
      orderDetails,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Payment initiated:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("STK Push error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment request failed" });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
