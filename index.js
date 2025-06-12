import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
const app = express();
app.options("*", cors());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://magic-board-frontend.vercel.app",
  "https://magic-board-chi.vercel.app",
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
async function generate(imageBase64) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      `You are given an image containing a mathematical expression, equation, or drawing that represents a math problem. ` +
      `Your task is to interpret and solve the problem shown in the image. ` +
      `Follow the PEMDAS rule strictly: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right). ` +
      `Please explain the steps involved in solving the problem briefly, and then clearly state the final answer at the end. ` +
      `For example:\n` +
      `Q: 2 + 3 * 4 => First, multiply 3 * 4 = 12. Then add 2 + 12 = 14. Final Answer: 14\n` +
      `Q: 2 + 3 + 5 * 4 - 8 / 2 => Multiply 5 * 4 = 20, divide 8 / 2 = 4, then compute 2 + 3 = 5, 5 + 20 = 25, 25 - 4 = 21. Final Answer: 21\n` +
      `Avoid using code blocks, markdown, JSON, or special characters. Just write the explanation and then state the final answer clearly.`;

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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
