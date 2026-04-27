require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/review', async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    const prompt = `
You are a Senior Code Reviewer.

STRICT RULES:
- Return ONLY valid JSON
- No explanation outside JSON
- Keep output short
- optimizedCode MUST NOT be empty
- optimizedCode MUST be a string

FORMAT:
{
  "status": "Grade",
  "summary": "Short explanation",
  "details": ["point1", "point2"],
  "optimizedCode": "corrected code"
}

Code:
${code}
`;

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: "user", content: prompt }
                ],
                max_tokens: 800
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5000"
                }
            }
        );

        const responseText = response.data.choices[0].message.content;

        console.log("RAW RESPONSE:\n", responseText);

        // ✅ Safe JSON extraction
        try {
            const start = responseText.indexOf('{');
            const end = responseText.lastIndexOf('}');

            if (start === -1 || end === -1) throw new Error("Invalid JSON");

            const jsonString = responseText.substring(start, end + 1);
            const parsed = JSON.parse(jsonString);

            return res.json({
                status: parsed.status || "N/A",
                summary: parsed.summary || "No summary",
                details: Array.isArray(parsed.details) ? parsed.details : ["No details"],
                optimizedCode: typeof parsed.optimizedCode === "string"
                    ? parsed.optimizedCode
                    : "No optimized code generated"
            });

        } catch (parseErr) {
            console.log("❌ JSON Parse Failed");

            return res.json({
                status: "Error",
                summary: "AI formatting issue",
                details: [responseText.slice(0, 300)],
                optimizedCode: "No optimized code generated"
            });
        }

    } catch (err) {
        console.error("❌ OpenRouter Error:", err.response?.data || err.message);

        return res.status(500).json({
            error: "AI request failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});