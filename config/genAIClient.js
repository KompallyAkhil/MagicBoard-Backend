import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({apiKey : process.env.API_KEY}); 
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default { genAI, ai };