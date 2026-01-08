const axios = require("axios");

const API_KEY = "AIzaSyBBP2xIHC8lA7kp_D9Ssh8kQGoxbPOqyWU";

async function testGemini() {
  try {
    const res = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
      {
        contents: [
          {
            role: "user",
            parts: [{ text: "Say hello in one line" }]
          }
        ]
      },
      {
        params: { key: API_KEY },
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log("✅ Gemini Response:");
    console.log(res.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("❌ Gemini Error:");
    console.error(err.response?.data || err.message);
  }
}

testGemini();
