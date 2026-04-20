import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

// Enable CORS so your Carrd site can call this backend
app.use(cors({
  origin: "*" // For testing; you can restrict to your Carrd URL later
}));
app.use(express.json());

// Initialize Gemini with your API key (loaded from Render environment variables)
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Gemini API backend is running!" });
});

// Main Gemini endpoint - your Carrd site will call this
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    res.json({ 
      success: true, 
      result: response.text 
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
