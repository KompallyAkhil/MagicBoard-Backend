import express from "express";
import cors from "cors"
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv"
import fs from "fs"
const app = express()
app.use(cors({
    origin:"https://magic-board-frontend.vercel.app/",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}))
const PORT = 5000
app.use(express.json({ limit: '10mb' }));
dotenv.config()
async function generate() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Please perform the following tasks:
    
        1. If the input contains a mathematical expression or equation, solve it:
           - Provide a detailed, step-by-step solution.
           - Include the final answer, clearly labeled.
    
        2. If the input does not contain a mathematical expression or equation, describe what it resembles or provide relevant insights about it.
    
        Ensure to have output in your response.
    `;
        
        const image = {
            inlineData: {
                data: Buffer.from(fs.readFileSync("download.png")).toString("base64"),
                mimeType:"image/jpeg",
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
        fs.writeFileSync("download.png", base64Data, { encoding: 'base64' });
        const Answer = await generate() 
        console.log(Answer)
        if (Answer){
            return res.json({ success: true, answer: Answer });
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
