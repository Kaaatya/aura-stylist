import { GoogleGenAI, Type } from "@google/genai";
import { BodyType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeBodyType = async (measurements: { bust: number, waist: number, hips: number }): Promise<BodyType> => {
  const prompt = `Based on these measurements (in cm): Bust: ${measurements.bust}, Waist: ${measurements.waist}, Hips: ${measurements.hips}. 
  Determine the body type from these options: Hourglass, Pear, Apple, Rectangle, Inverted Triangle. 
  Return only the name of the body type.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return (response.text?.trim() as BodyType) || 'Unknown';
  } catch (error) {
    console.error("Error analyzing body type:", error);
    return 'Unknown';
  }
};

export const analyzeStyleFromImages = async (base64Images: string[]): Promise<string[]> => {
  const imageParts = base64Images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img.split(',')[1] || img
    }
  }));

  const prompt = "Analyze these fashion images and extract the key style preferences, colors, and aesthetics. Return a list of 5-10 descriptive tags.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error analyzing style:", error);
    return [];
  }
};

export const getOutfitRecommendations = async (
  wardrobe: any[], 
  bodyType: string, 
  preferences: string[], 
  occasion: string
): Promise<any> => {
  const prompt = `Given a user with body type "${bodyType}" and style preferences "${preferences.join(', ')}", 
  suggest 3 outfits for the occasion "${occasion}" from their wardrobe. 
  Wardrobe items: ${JSON.stringify(wardrobe)}.
  Return a JSON array of outfit objects, each with 'items' (array of item IDs), 'reasoning', and 'occasion'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
};

export const generateCapsuleWardrobe = async (
  budget: number,
  bodyType: string,
  preferences: string[],
  wardrobe: any[]
): Promise<any> => {
  const prompt = `Create a capsule wardrobe for a user with a budget of ${budget} USD, body type "${bodyType}", and style preferences "${preferences.join(', ')}".
  The user already has these items in their wardrobe: ${JSON.stringify(wardrobe.map(i => ({ name: i.name, category: i.category, color: i.color, tags: i.tags })))}.
  Suggest 10 essential items to buy that complement their existing wardrobe and fit their style. 
  For each item, provide: name, category, estimated price, and why it fits their style and complements their current pieces.
  Return a JSON object with 'items' (array of objects) and 'totalEstimatedCost'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating capsule:", error);
    return { items: [], totalEstimatedCost: 0 };
  }
};

export const analyzeWardrobeItem = async (base64Image: string): Promise<{ category: string, color: string, tags: string[] }> => {
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1] || base64Image
    }
  };

  const prompt = "Analyze this clothing item. Provide its category (e.g., Top, Bottom, Outerwear, Shoes), primary color, and 3-5 descriptive style tags. Return as JSON.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            color: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["category", "color", "tags"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing item:", error);
    return { category: "Unknown", color: "Unknown", tags: [] };
  }
};
