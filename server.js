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

// Health check endpoint - tests if server is running
app.get("/", (req, res) => {
  res.json({ status: "Gemini API backend is running!" });
});

// List of currently available models (as of 2026)
// Source: https://ai.google.dev/gemini-api/docs/models
const models = [
  "gemini-2.5-flash",        // Latest fast model - RECOMMENDED
  "gemini-2.0-flash",        // Fallback to 2.0 series
  "gemini-2.0-flash-lite",   // Lightweight option
  "gemini-1.5-flash"         // Legacy fallback (may not work)
];

// Function to try multiple models if one fails
async function tryGeminiModels(prompt) {
  let lastError = null;
  
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      console.log(`Success with model: ${model}`);
      return response;
    } catch (error) {
      console.log(`Model ${model} failed: ${error.message}`);
      lastError = error;
    }
  }
  
  throw lastError || new Error("All Gemini models failed");
}

// Main Gemini endpoint - your Carrd site will call this
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log(`Received prompt: ${prompt.substring(0, 100)}...`);
    
    // Try multiple models automatically
    const response = await tryGeminiModels(prompt);
    
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Gemini with fallback models: ${models.join(", ")}`);
});
