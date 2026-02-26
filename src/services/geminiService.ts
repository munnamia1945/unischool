import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const explainConcept = async (concept: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the core engine of "Unischool AI". Your task is to provide accurate and educational content.
    
    For the given concept, you MUST strictly follow this 5-step format:
    
    1. ## সংক্ষিপ্ত সার (Overview):
    Provide a 2-3 line core summary of the concept.
    
    2. ## সহজ ব্যাখ্যা (Simple Breakdown):
    Explain the concept as if you are talking to a 5th-grade student. Break down complex terms into simple language.
    
    3. ## বাস্তব উদাহরণ (Real-life Analogy):
    Compare the concept to something familiar in our daily lives to make it clearer.
    
    4. ## গুরুত্বপূর্ণ পয়েন্ট (Key Takeaways):
    Provide exactly 3 most important points about the concept in a bulleted list.
    
    5. ## মনে রাখার টিপস (Quick Tip):
    Provide a small technique, mnemonic, or rhyme to help remember the concept.
    
    Use Markdown formatting. Use ## for headings. If the input is in Bengali, respond in Bengali. Maintain a clean and attractive layout.
    
    Concept: ${concept}`,
  });
  return response.text;
};

export const generateMCQs = async (topic: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the core engine of "Unischool AI". Generate exactly 10 high-quality Multiple Choice Questions (MCQs) based on the following topic. 
    Each question must have exactly 4 options. 
    Provide a concise 1-line explanation for each correct answer.
    
    Topic: ${topic}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
            explanation: { type: Type.STRING, description: "A concise 1-line explanation of why this answer is correct" }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateShortNotes = async (topic: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create concise, high-quality short notes for revision on the following topic. Use bullet points, bold text for key terms, and a clear structure. If the input is in Bengali, respond in Bengali.
    
    Topic: ${topic}`,
  });
  return response.text;
};

export const generateResearchReview = async (topic: string, userInfo?: { name?: string; institution?: string }) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a Senior Scientific Researcher. Your task is to create a formal research review based on the following paper link, topic, or text.

STRICT RULES:
1. FORMAT: The entire output MUST be in LaTeX code format so it can be used directly in Overleaf or any LaTeX editor.
2. LANGUAGE: Use extremely clear and academic English.
3. STRUCTURE: The report MUST include these sections:
   - \\title{...} (A suitable title)
   - \\author{${userInfo?.name || 'Researcher'}}
   ${userInfo?.institution ? `\\affil{${userInfo.institution}}` : ''}
   - \\section{Abstract} (Core summary of the paper)
   - \\section{Key Findings} (Most important discoveries in bullet points)
   - \\section{Methodology} (Analysis of research methods)
   - \\section{Critical Analysis} (Limitations and strengths of the paper)
   - \\section{Conclusion} (Future research directions)

4. MATHEMATICAL EQUATIONS: Any formulas or equations MUST be written inside $...$ or $$...$$.
5. USER INFO: Integrate the provided user name and institution into the \\author and \\affil sections if available.

WARNING: Do NOT include any conversational text at the beginning or end (e.g., "Here is your review"). Start directly with \\documentclass{article}.

Input: ${topic}`,
  });
  return response.text;
};
