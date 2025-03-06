require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // Allow frontend requests

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error("❌ API Key is missing! Check your .env file.");
  process.exit(1);
}

app.post("/api/chat", async (req, res) => {
  console.log("Received messages:", JSON.stringify(req.body.messages, null, 2));

  // Validate and sanitize message roles
  const sanitizedMessages = req.body.messages.map((msg) => {
    if (!["system", "user", "assistant", "function", "tool", "developer"].includes(msg.role)) {
      console.warn(`⚠️ Invalid role detected: ${msg.role}. Changing it to "assistant".`);
      return { role: "assistant", content: msg.content };
    }
    return msg;
  });

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: sanitizedMessages, // Send only valid roles
        max_tokens: 100, // Set token limit
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API Response:", JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error("OpenAI API Error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error?.message || "Failed to generate response",
    });
  }
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.listen(5000, () => console.log("🚀 Backend running on http://localhost:5000"));
