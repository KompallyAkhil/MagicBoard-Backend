// routes/solve.js
import genAI from "../config/genAIClient.js";
import express from "express";
const router = express.Router();

// Generate math solution

async function generate(imageBase64) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    console.error("Error generating math solution:", error);
    return;
  }
}

router.post("/", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.json({ success: false, error: "No image provided." });
    }

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const answer = await generate(base64Data);

    if (answer) {
      return res.json({ success: true, answer });
    } else {
      return res.json({ success: false, error: "Failed to generate answer." });
    }
  } catch (error) {
    console.error("Error solving math:", error);
    return res.json({ success: false, error: error.message });
  }
});

export default router;
