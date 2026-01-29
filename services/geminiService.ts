
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DiagramType } from "../types.ts";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateDiagramFromCode(inputCode: string, targetType: DiagramType = DiagramType.CLASS): Promise<string> {
    const ai = this.getClient();
    const prompt = `
      Convert the following Unreal Engine C++ or Blueprint pseudo-code into a Mermaid.js ${targetType} diagram.
      Rules:
      1. Ensure the diagram follows Unreal Engine naming conventions (e.g., Prefixes A, U, S, F).
      2. Identify relationships like UPROPERTY pointers as associations.
      3. Handle inheritance correctly (e.g., ACharacter -> AActor).
      4. Include key member variables and functions.
      
      Input Code:
      ${inputCode}
      
      Return ONLY the raw Mermaid.js code block, without backticks or markdown formatting. Start directly with the diagram type (e.g. classDiagram).
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    return response.text?.trim() || '';
  }

  async analyzeArchitecture(diagramCode: string): Promise<any> {
    const ai = this.getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Analyze this Unreal Engine architecture (Mermaid diagram format) and suggest improvements.
        Focus on:
        - Memory management (Object lifetimes)
        - Blueprint vs C++ optimization
        - Design patterns (Subsystems, Components, Data Assets)
        
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

    const text = response.text || '{}';
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response", text);
      return { refactorSuggestions: ["Error analyzing architecture"], complexityScore: 0, potentialIssues: [] };
    }
  }
}

export const geminiService = new GeminiService();
