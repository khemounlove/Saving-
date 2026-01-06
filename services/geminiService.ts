import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Add some transactions to get AI-powered financial insights!";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format data for the model
  const summary = transactions.map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date.slice(0, 10)
  }));

  const prompt = `
    Act as a professional financial advisor. Analyze the following user transaction data:
    ${JSON.stringify(summary)}

    Provide 3 concise, actionable bullet points of financial advice or insights. 
    Focus on spending habits, potential savings, or category-specific observations.
    Keep it encouraging and brief (max 100 words total). 
    Do not use complex formatting, just bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful and concise financial advisor who provides personalized insights based on spending data.",
        temperature: 0.7,
      }
    });

    return response.text || "I've analyzed your data but couldn't generate a specific insight right now. Try adding more varied records!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI advisor is currently unavailable. Please check your connection or try again later.";
  }
};