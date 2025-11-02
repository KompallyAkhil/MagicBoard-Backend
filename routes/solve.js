// routes/solve.js
import genAI from "../config/genAIClient.js";
import express from "express";
const router = express.Router();

// Generate math solution

async function generate(imageBase64) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
          You are a visual understanding assistant. You will receive an image that may contain any type of content — such as text, handwriting, equations, diagrams, graphs, objects, or real-world scenes.

          Your goal is to:
          1. Quickly identify what the image represents.
          2. Perform the most relevant and useful task based on that content:
            - If it has text (printed or handwritten) → Extract and return the text directly.
            - If it’s a math expression, formula, or equation → Interpret and solve it step-by-step.
            - If it’s a diagram, graph, or table → Explain what it shows and summarize key information.
            - If it’s a document or form → Summarize its main points or purpose.
            - If it’s a real-world photo or object → Describe it briefly and clearly.
          3. Do **not** describe that the image “contains” or “shows” something. 
            Just give the final meaningful result (text, answer, summary, or description).

          Keep the response:
          - In plain text
          - Concise, clear, and focused on the useful output
          - Without code blocks, markdown, or unnecessary formatting`;

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
