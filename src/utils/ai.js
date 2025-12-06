// // src/utils/ai.js
// import { GoogleGenAI } from "@google/genai";

// const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// console.log("Gemini key:", import.meta.env.VITE_GEMINI_API_KEY);

// // Only create the AI instance if the API key exists
// let ai = null;

// if (apiKey && apiKey.length > 10) {
//   ai = new GoogleGenAI({ apiKey });
// }

// export async function generateFinancialInsights({
//   totalSent,
//   totalReceived,
//   biggestMonth,
//   totalTransactions,
// }) {
//   try {
//     if (!ai) {
//       console.warn("AI not configured (missing API key).");
//       return {
//         personality: "AI not configured 🤖",
//         caption: "Add your API key to unlock AI captions!",
//         tagline: "M-Pesa Wrapped (AI disabled)",
//       };
//     }

//     const prompt = `
// You are an AI that creates M-Pesa Wrapped insights.
// Generate:

// 1. A fun & youthful *financial personality type*
// 2. A 2–3 line motivational caption
// 3. A bold tagline for a shareable poster

// Make it energetic, Gen-Z friendly & Kenyan.

// DATA:
// - Total Sent: ${totalSent}
// - Total Received: ${totalReceived}
// - Biggest Month: ${biggestMonth?.month || "N/A"}
// - Total Transactions: ${totalTransactions}
// `;

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt,
//     });

//     const text = response.text();

//     // Optional: you can parse it into structured pieces
//     return {
//       personality: text.split("\n")[0] || "",
//       caption: text.split("\n").slice(1, 3).join(" "),
//       tagline: text.split("\n").slice(3).join(" "),
//       raw: text,
//     };
//   } catch (error) {
//     console.error("AI Generation failed:", error);

//     return {
//       personality: "AI offline 😅",
//       caption: "We couldn’t generate your insights right now.",
//       tagline: "Try again shortly!",
//     };
//   }
// }
