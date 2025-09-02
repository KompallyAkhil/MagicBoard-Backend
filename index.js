import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import axios from "axios";
const app = express();
app.options("*", cors());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://magic-board-frontend.vercel.app",
  "https://magic-board-chi.vercel.app",
  "https://magicboard.akhilkompally.app",
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  })
);

const PORT = 5000;
app.use(express.json({ limit: "10mb" }));
dotenv.config();

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function generate(imageBase64) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      `You are given an image containing a mathematical expression, equation, drawing, or graph that represents a math problem. ` +
      `Your first task is to clearly identify and describe what the image contains (e.g., an algebraic equation, a geometric figure, a plotted graph, etc.). ` +
      `Then, interpret and solve the problem shown in the image. ` +
      `Follow the PEMDAS rule strictly: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right). ` +
      `Please explain the steps involved in solving the problem briefly, and then clearly state the final answer at the end. ` +
      `For example:\n` +
      `Q: 2 + 3 * 4 => First, multiply 3 * 4 = 12. Then add 2 + 12 = 14. Final Answer: 14\n` +
      `Q: 2 + 3 + 5 * 4 - 8 / 2 => Multiply 5 * 4 = 20, divide 8 / 2 = 4, then compute 2 + 3 = 5, 5 + 20 = 25, 25 - 4 = 21. Final Answer: 21\n` +
      `Avoid using code blocks, markdown, JSON, or special characters. Just describe the image, explain the solution steps, and then clearly state the final answer.`;

    const image = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/png",
      },
    };

    const result = await model.generateContent([prompt, image]);
    return result.response.text();
  } catch (error) {
    return;
  }
}

app.post("/solve", async (req, res) => {
  const { image } = req.body;
  if (image) {
    try {
      const base64Data = image.replace(/^data:image\/png;base64,/, "");
      const answer = await generate(base64Data);
      if (answer) {
        return res.json({ success: true, answer: answer });
      } else {
        return res.json({
          success: false,
          error: "Failed to generate answer.",
        });
      }
    } catch (error) {
      return res.json({ success: false, error: "No image provided." });
    }
  }
});

// Function to analyze canvas drawing and enhance prompt
async function analyzeDrawingForPrompt(imageBase64, userPrompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const analysisPrompt = `Analyze this drawing and combine it with the user's prompt: "${userPrompt}". 
    Describe what you see in the drawing and create an enhanced, detailed prompt for image generation that combines both the visual elements from the drawing and the user's text prompt. 
    Focus on artistic style, composition, colors, and mood. Keep it under 1000 characters.
    Return only the enhanced prompt, nothing else.`;

    const image = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/png",
      },
    };

    const result = await model.generateContent([analysisPrompt, image]);
    return result.response.text();
  } catch (error) {
    console.error("Error analyzing drawing:", error);
    return userPrompt; // Fallback to original prompt
  }
}

app.post("/generate-image-prompt", async (req, res) => {
  const { image, prompt } = req.body;

  if (!image || !prompt) {
    return res.json({
      success: false,
      error: "Image and prompt are required.",
    });
  }

  try {
    const base64Data = image.replace(/^data:image\/png;base64,/, "");

    // Analyze the drawing and enhance the prompt using Gemini
    const enhancedPrompt = await analyzeDrawingForPrompt(base64Data, prompt);

    // Generate image using Stability AI API (Core model - cheaper)
    const stabilityResponse = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        text_prompts: [
          {
            text: enhancedPrompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 20,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
      }
    );

    if (
      stabilityResponse.data.artifacts &&
      stabilityResponse.data.artifacts.length > 0
    ) {
      const generatedImageData = stabilityResponse.data.artifacts[0].base64;

      // Send image directly as base64 data URL
      const imageDataUrl = `data:image/png;base64,${generatedImageData}`;

      return res.json({
        success: true,
        imageUrl: imageDataUrl,
        enhancedPrompt: enhancedPrompt,
        originalPrompt: prompt,
      });
    } else {
      return res.json({
        success: false,
        error: "No image was generated by Stability AI.",
      });
    }
  } catch (error) {
    console.error("Error generating image:", error);
    if (error.response) {
      console.error("Stability AI API Error:", error.response.data);
      return res.json({
        success: false,
        error: `Stability AI Error: ${
          error.response.data.message || "Unknown error"
        }`,
      });
    }
    return res.json({
      success: false,
      error: error.message || "Failed to generate image.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
