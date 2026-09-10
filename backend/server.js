const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "ScamSentinel AI Backend is running"
  });
});

app.post("/api/analyze", (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      error: "Message is required"
    });
  }

  const text = message.toLowerCase();

  let score = 0;
  const reasons = [];

  if (/urgent|immediately|act now|today|within/i.test(text)) {
    score += 18;
    reasons.push("Urgency language detected");
  }

  if (/otp|password|pin|cvv|kyc/i.test(text)) {
    score += 28;
    reasons.push("Sensitive information requested");
  }

  if (/bank|account|upi|payment|transfer/i.test(text)) {
    score += 22;
    reasons.push("Financial information or payment request");
  }

  if (/prize|winner|lottery|reward|cashback/i.test(text)) {
    score += 30;
    reasons.push("Prize or reward scam pattern");
  }

  if (/http:\/\/|https:\/\/|www\.|bit\.ly|tinyurl/i.test(text)) {
    score += 20;
    reasons.push("Suspicious link detected");
  }

  if (/police|arrest|legal action|digital arrest/i.test(text)) {
    score += 28;
    reasons.push("Threat or impersonation pattern detected");
  }

  score = Math.min(score, 100);

  let risk = "LOW RISK";

  if (score >= 60) {
    risk = "HIGH RISK";
  } else if (score >= 30) {
    risk = "SUSPICIOUS";
  }

  res.json({
    risk,
    score,
    reasons,
    analyzedBy: "ScamSentinel AI Security Engine"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ScamSentinel AI Backend running on port ${PORT}`);
});
