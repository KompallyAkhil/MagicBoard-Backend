import express from "express";
import cors from "cors"
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv"
import fs from "fs"
const app = express()
app.options('*', cors());
const allowedOrigins = ["http://localhost:3000","http://localhost:5173","https://magic-board-frontend.vercel.app","https://magic-board-chi.vercel.app/"]
app.use(cors({
    origin:allowedOrigins,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
    credentials: true,
}))
const PORT = 5000
app.use(express.json({ limit: '10mb' }));
dotenv.config()
async function generate(imageBase64) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Please perform the following tasks:
    
        1. **Mathematical Expressions:**
           - If the input contains a mathematical expression or equation, solve it.
           - Provide a detailed, step-by-step solution.
           - Clearly label the final answer.
    
        2. **Non-Mathematical Inputs:**
           - If the input does not contain a mathematical expression or equation, describe its nature or provide relevant insights about it.
    
        3. **Greetings:**
           - If the input contains greetings such as "Hi," "Hello," "Good Morning," or "Good Night," respond with a warm greeting back don't include emojis for it.
    
        Ensure to provide clear output in your response.
    `;
    
        
        const image = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/png",
            },
          
        };   
        const result = await model.generateContent([prompt, image]);
        return result.response.text()
    } catch (error) {
        return
    }
}
app.post('/solve',async (req,res)=>{
    const {image} = req.body;
   if(image){
    try {
        const base64Data = image.replace(/^data:image\/png;base64,/, "");
        const answer = await generate(base64Data) 
        if (answer){
            return res.json({ success: true, answer: answer });
        }
        else{
            return res.json({ success: false, error: "Failed to generate answer." });
        }
    } catch (error) {
        return res.json({ success: false, error: "No image provided." });
    }
}
})
app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})
