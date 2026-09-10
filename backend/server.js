const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    })
  : null;


/* =========================================================
   HOME
   ========================================================= */

app.get("/", (req, res) => {

  res.json({
    status: "online",
    message: "ScamSentinel AI Backend is running",
    ai: ai ? "Gemini AI connected" : "Gemini API key missing"
  });

});


/* =========================================================
   GEMINI AI ANALYSIS
   ========================================================= */

async function analyzeWithGemini(message) {

  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `
You are ScamSentinel AI, a cybersecurity scam and phishing detection engine.

Analyze the following message carefully.

Your job is to identify:
- scam probability
- phishing attempts
- financial fraud
- credential theft
- OTP/PIN/password requests
- fake prizes or rewards
- suspicious links
- impersonation
- threats
- social engineering
- remote access requests

Return ONLY valid JSON.

Message to analyze:
${message}
`;

  const response = await ai.models.generateContent({

    model: "gemini-2.5-flash",

    contents: prompt,

    config: {

      responseMimeType: "application/json",

      responseSchema: {

        type: "object",

        properties: {

          risk: {
            type: "string",
            enum: [
              "LOW RISK",
              "SUSPICIOUS",
              "HIGH RISK"
            ]
          },

          score: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },

          threatType: {
            type: "string"
          },

          reasons: {
            type: "array",
            items: {
              type: "string"
            }
          },

          warningSigns: {
            type: "array",
            items: {
              type: "string"
            }
          },

          recommendedActions: {
            type: "array",
            items: {
              type: "string"
            }
          }

        },

        required: [
          "risk",
          "score",
          "threatType",
          "reasons",
          "warningSigns",
          "recommendedActions"
        ]

      }

    }

  });

  return JSON.parse(response.text);

}


/* =========================================================
   ANALYZE MESSAGE
   ========================================================= */

app.post("/api/analyze", async (req, res) => {

  const { message } = req.body;

  if (!message || !message.trim()) {

    return res.status(400).json({

      error: "Message is required"

    });

  }


  try {

    const result =
      await analyzeWithGemini(message);


    res.json({

      risk: result.risk,

      score: result.score,

      reasons: result.reasons,

      warnings: result.warningSigns,

      threatType: result.threatType,

      recommendedActions:
        result.recommendedActions,

      analyzedBy:
        "ScamSentinel AI + Gemini AI",

      aiPowered: true

    });


  } catch (error) {

    console.error(
      "Gemini AI Error:",
      error.message
    );


    /*
      Fallback security engine
      works even if Gemini is temporarily unavailable.
    */

    const text =
      message.toLowerCase();

    let score = 0;

    const reasons = [];


    if (
      /urgent|immediately|act now|today|within/i
        .test(text)
    ) {

      score += 18;

      reasons.push(
        "Urgency language detected"
      );

    }


    if (
      /otp|password|pin|cvv|kyc/i
        .test(text)
    ) {

      score += 28;

      reasons.push(
        "Sensitive information requested"
      );

    }


    if (
      /bank|account|upi|payment|transfer/i
        .test(text)
    ) {

      score += 22;

      reasons.push(
        "Financial information or payment request"
      );

    }


    if (
      /prize|winner|lottery|reward|cashback/i
        .test(text)
    ) {

      score += 30;

      reasons.push(
        "Prize or reward scam pattern"
      );

    }


    if (
      /http:\/\/|https:\/\/|www\.|bit\.ly|tinyurl/i
        .test(text)
    ) {

      score += 20;

      reasons.push(
        "Suspicious link detected"
      );

    }


    if (
      /police|arrest|legal action|digital arrest/i
        .test(text)
    ) {

      score += 28;

      reasons.push(
        "Threat or impersonation pattern detected"
      );

    }


    score =
      Math.min(score, 100);


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

      warnings: [],

      threatType:
        "Security Pattern Analysis",

      recommendedActions: [

        "Do not share sensitive information.",

        "Avoid suspicious links.",

        "Verify the sender independently."

      ],

      analyzedBy:
        "ScamSentinel AI Security Engine",

      aiPowered: false

    });

  }

});


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {

  console.log(
    `ScamSentinel AI Backend running on port ${PORT}`
  );

});
