import { GoogleGenAI, Type } from "@google/genai";
import { DB } from "./db.js";

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log("Gemini AI Client initialized successfully for semantic item comparison.");
      } catch (err) {
        console.error("Failed to initialize Gemini AI Client", err);
        ai = null;
      }
    }
  }
  return ai;
}

// Interface for Match Output
export interface CleanMatchResult {
  matchId: string;
  itemName: string;
  category: string;
  location: string;
  date: string;
  similarityScore: number; // 0 to 100
  reason: string;
}

/**
 * Calculates similarity matching using Gemini (if key exists) or local keyword Jaccard algorithm (fallback).
 */
export async function findMatchesForItem(
  targetItem: {
    itemName: string;
    description: string;
    category: string;
    _id: string;
    type: 'Lost' | 'Found';
  }
): Promise<CleanMatchResult[]> {
  // 1. Get counterpart listings
  const allLost = await DB.lostItems.find();
  const allFound = await DB.foundItems.find();
  
  // Exclude same items, find counterparts
  const candidates = targetItem.type === 'Lost' 
    ? allFound.filter((item: any) => item.status !== 'Returned' && item.status !== 'Claimed')
    : allLost.filter((item: any) => item.status !== 'Returned');

  if (candidates.length === 0) {
    return [];
  }

  const client = getAIClient();
  if (client) {
    try {
      // Package query for Gemini
      const prompt = `
        You are the AI Matchmaker of a University Lost and Found Portal.
        We have a new item posted by a student (${targetItem.type} Item):
        - Name: "${targetItem.itemName}"
        - Category: "${targetItem.category}"
        - Description: "${targetItem.description}"

        Please analyze these potential counter-part items reported on campus and judge if any are likely to be the SAME physical item.
        Candidates:
        ${candidates.map((c: any, idx: number) => `
          [Candidate Index: ${idx}]
          ID: ${c._id}
          Name: "${c.itemName}"
          Category: "${c.category}"
          Description: "${c.description}"
          Location: "${c.locationFound || c.locationLost}"
          Date: "${c.dateFound || c.dateLost}"
        `).join('\n')}

        Return a JSON array of match suggestions. Rate each similarity from 0 to 100.
        Only include candidates who have a score of 20 or higher.
        Provide a brief, supportive explanation for your score (e.g., "The brand, color and specific scratch description match perfectly").
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                candidateIndex: { type: Type.INTEGER, description: "The index of the candidate provided" },
                similarityScore: { type: Type.INTEGER, description: "Score from 0 to 100 indicating likelihood of a match" },
                reason: { type: Type.STRING, description: "One sentence explaining why it is or is not a match" },
              },
              required: ["candidateIndex", "similarityScore", "reason"]
            }
          }
        }
      });

      const rawText = response.text || "[]";
      const matches = JSON.parse(rawText.trim());

      const results: CleanMatchResult[] = [];
      for (const m of matches) {
        const idx = m.candidateIndex;
        if (idx !== undefined && candidates[idx]) {
          const matchedItem = candidates[idx];
          results.push({
            matchId: matchedItem._id,
            itemName: matchedItem.itemName,
            category: matchedItem.category,
            location: matchedItem.locationFound || matchedItem.locationLost,
            date: matchedItem.dateFound || matchedItem.dateLost,
            similarityScore: m.similarityScore,
            reason: m.reason
          });
        }
      }

      // Sort with highest score first
      return results.sort((a,b) => b.similarityScore - a.similarityScore);

    } catch (err) {
      console.error("Error during Gemini similarity matching, falling back to local text matches:", err);
      // Fall through to standard matching
    }
  }

  // Backup simple keyword matching algorithm
  const results: CleanMatchResult[] = [];
  const targetTokens = (targetItem.itemName + ' ' + targetItem.description).toLowerCase().split(/\s+/);

  for (const c of candidates) {
    let score = 0;
    const reasonParts: string[] = [];

    // Category match is solid boost
    if (c.category.toLowerCase() === targetItem.category.toLowerCase()) {
      score += 35;
      reasonParts.push("Belong to same category");
    }

    // Keyword overlap
    const candidateText = (c.itemName + ' ' + c.description).toLowerCase();
    let tokenOverlap = 0;
    targetTokens.forEach(token => {
      if (token.length > 3 && candidateText.includes(token)) {
        tokenOverlap++;
      }
    });

    if (tokenOverlap > 0) {
      const parsedBoost = Math.min(tokenOverlap * 15, 60);
      score += parsedBoost;
      reasonParts.push(`Share terms like "${targetTokens.find(t=>t.length > 3 && candidateText.includes(t)) || ''}"`);
    }

    if (score >= 20) {
      results.push({
        matchId: c._id,
        itemName: c.itemName,
        category: c.category,
        location: c.locationFound || c.locationLost,
        date: c.dateFound || c.dateLost,
        similarityScore: score,
        reason: reasonParts.length > 0 ? reasonParts.join(' & ') : "General category match"
      });
    }
  }

  return results.sort((a,b) => b.similarityScore - a.similarityScore);
}
