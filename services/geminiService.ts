
import { GoogleGenAI, Type } from "@google/genai";
import { DiagramType } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateDiagramFromCode(inputCode: string, targetType: DiagramType = DiagramType.CLASS): Promise<string> {
    const prompt = `
      Convert the following Unreal Engine C++ or Blueprint pseudo-code into a Mermaid.js ${targetType} diagram.
      Ensure the diagram follows Unreal Engine naming conventions (e.g., Prefixes A, U, S, F).
      Include member variables and functions if present.
      
      Input Code:
      ${inputCode}
      
      Return ONLY the Mermaid.js code block, without backticks or markdown formatting.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return response.text?.trim() || '';
  }

  async analyzeArchitecture(diagramCode: string): Promise<any> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Analyze this Unreal Engine architecture (Mermaid diagram format) and suggest improvements, 
        design pattern optimizations, and identify potential memory or performance issues.
        
        Diagram Code:
        ${diagramCode}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refactorSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            complexityScore: { type: Type.NUMBER },
            potentialIssues: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["refactorSuggestions", "complexityScore", "potentialIssues"]
        }
      }
    });

    return JSON.parse(response.text?.trim() || '{}');
  }
}

export const geminiService = new GeminiService();
