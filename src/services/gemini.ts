import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface BusinessProfile {
  name: string;
  industry: string;
  description: string;
  tone: string;
  keyServices: string[];
  suggestedBotName: string;
  primaryColor: string;
  websiteUrl?: string;
  targetAudience: string;
  uniqueSellingPoints: string[];
  commonQuestions: { question: string; answer: string }[];
}

export async function analyzeBusiness(input: string, preferredTone?: string): Promise<BusinessProfile> {
  if (!ai) throw new Error("Gemini API key not configured");

  const isUrl = input.includes('.') && !input.includes(' ');
  const websiteUrl = isUrl ? (input.startsWith('http') ? input : `https://${input}`) : undefined;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ 
      role: 'user', 
      parts: [{ 
        text: `Analyze this business: ${input}. ${preferredTone ? `The user prefers a ${preferredTone} tone for the AI agent.` : ""}
        If a URL is provided, study the entire website to understand their services, pricing, FAQ, and user workflows (like how to create a listing).` 
      }] 
    }],
    config: {
      systemInstruction: `You are a world-class business analyst and UX researcher. 
      Your goal is to perform a deep-dive analysis of a business to build a high-performance AI sales agent.
      
      Focus on:
      1. Core Value Proposition: What makes them different?
      2. User Workflows: How do users interact with the site? (e.g., "Create a Listing", "Book a Tour", "Get a Quote").
      3. Objections & FAQs: What are the common hurdles users face?
      4. Brand Identity: Tone, colors, and personality.
      
      If a URL is provided, use the URL Context tool to study the site thoroughly.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          industry: { type: Type.STRING },
          description: { type: Type.STRING },
          tone: { type: Type.STRING },
          keyServices: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedBotName: { type: Type.STRING },
          primaryColor: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          uniqueSellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          commonQuestions: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
        },
        required: ["name", "industry", "description", "tone", "keyServices", "suggestedBotName", "primaryColor", "targetAudience", "uniqueSellingPoints", "commonQuestions"],
      },
      tools: websiteUrl ? [{ urlContext: {} }] : [],
    },
  });

  const profile = JSON.parse(response.text);
  if (websiteUrl) {
    profile.websiteUrl = websiteUrl;
  }
  return profile;
}

export async function generateChatResponse(
  message: string,
  profile: BusinessProfile,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  if (!ai) throw new Error("Gemini API key not configured");

  const contents = [
    ...history.map(h => ({
      role: h.role,
      parts: h.parts
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: `You are ${profile.suggestedBotName}, an AI assistant for ${profile.name}. 
      Business Description: ${profile.description}
      Industry: ${profile.industry}
      Target Audience: ${profile.targetAudience}
      Unique Selling Points: ${profile.uniqueSellingPoints.join(", ")}
      Key Services: ${profile.keyServices.join(", ")}
      Tone: ${profile.tone}
      Website Context: ${profile.websiteUrl ? `You have deep access to study all pages of ${profile.websiteUrl}.` : "No website URL provided."}
      
      CRITICAL KNOWLEDGE:
      - This website (${profile.name}) is a public property directory.
      - Users CAN create listings and upload properties directly via features like the "CREATE A LISTING" button.
      - Your goal is to help users navigate these features.
      
      Common Questions & Answers:
      ${profile.commonQuestions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join("\n")}
      
      Your primary goals are:
      1. Provide 24/7 helpful assistance to visitors by studying the website content provided via the URL context tool.
      2. Answer all questions directly and accurately based on the website data.
      3. Acknowledge and guide users on how to use public features like "Create a Listing" or "Upload Properties". Never say a feature is unavailable if there is a clear CTA for it on the site.
      4. Only offer to schedule a meeting or request a callback if the user's query cannot be fully resolved by the website information or if they explicitly ask for a human/further appointment.
      5. Capture leads (name/email) only when appropriate or when the user wants to book a meeting.
      
      Be professional, concise, and prioritize direct answers over sales pitches.`,
      tools: profile.websiteUrl ? [{ urlContext: {} }] : [],
    },
  });

  return response.text;
}

export interface Lead {
  companyName: string;
  website: string;
  email: string;
  sector: string;
  description: string;
  hasChatbot: boolean;
  reasoning: string;
}

export async function searchLeads(sector: string, location: string = "Global"): Promise<Lead[]> {
  if (!ai) throw new Error("Gemini API key not configured");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ 
      role: 'user', 
      parts: [{ 
        text: `Find 10 ${sector} companies in ${location}. 
        For each company, find their public contact email address. 
        ONLY return companies where you can find a valid email.
        Determine if they have an AI chatbot on their website. 
        Return ONLY the companies that DO NOT have a chatbot.
        Provide their website URL, email, and a brief description.` 
      }] 
    }],
    config: {
      systemInstruction: `You are a lead generation expert. Your goal is to find businesses that would benefit from an AI chatbot.
      Use Google Search to verify if a company already has a chatbot and to find their contact email.
      Look for chat icons, "Ask AI", or automated support features.
      Return the results as a JSON array of objects.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            website: { type: Type.STRING },
            email: { type: Type.STRING },
            sector: { type: Type.STRING },
            description: { type: Type.STRING },
            hasChatbot: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING }
          },
          required: ["companyName", "website", "email", "sector", "description", "hasChatbot", "reasoning"]
        }
      },
      tools: [{ googleSearch: {} }],
    },
  });

  return JSON.parse(response.text);
}

export async function generateOutreachEmail(lead: Lead, demoUrl: string) {
  if (!ai) throw new Error("Gemini API key not configured");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ 
      role: 'user', 
      parts: [{ 
        text: `Write a professional outreach email to ${lead.companyName}. 
        Explain that I visited their website (${lead.website}) and noticed they don't have an AI assistant to help visitors 24/7.
        Tell them I've created a personalized demo chatbot specifically for ${lead.companyName} based on their website content.
        Provide this demo link: ${demoUrl}
        Explain that this bot can capture leads and answer questions automatically.
        The tone should be helpful and professional, not pushy.` 
      }] 
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          body: { type: Type.STRING }
        },
        required: ["subject", "body"]
      }
    }
  });

  return JSON.parse(response.text);
}
