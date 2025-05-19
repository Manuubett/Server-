const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let accessToken = "";

const getAccessToken = async () => {
  try {
    const credentials = `${process.env.PESAPAL_CONSUMER_KEY}:${process.env.PESAPAL_CONSUMER_SECRET}`;
    const encoded = Buffer.from(credentials).toString("base64");

    const response = await axios.get(
      "https://pay.pesapal.com/v3/api/Auth/RequestToken",
      {
        headers: {
          Authorization: `Basic ${encoded}`,
          "Content-Type": "application/json",
        },
      }
    );

    accessToken = response.data.token;
    console.log("Access Token fetched successfully.");
  } catch (error) {
    console.error("Failed to get access token:", error.response?.data || error.message);
  }
};

getAccessToken();

app.post("/stk-push", async (req, res) => {
  const { phone, amount } = req.body;

  const orderDetails = {
    amount,
    currency: "KES",
    description: "M-PESA Payment",
    callback_url: "https://example.com/callback",
    billing_address: {
      phone_number: phone,
      email_address: "client@example.com",
      country_code: "KE",
      first_name: "Customer",
      last_name: "One",
    },
  };

  try {
    const response = await axios.post(
      "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest",
      orderDetails,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("STK Push error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
