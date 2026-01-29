
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DiagramType } from "../types.ts";

export class GeminiService {
  private getClient() {
    // Strictly follow initialization guideline: use named parameter and process.env.API_KEY directly.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateDiagramFromCode(inputCode: string, targetType: DiagramType = DiagramType.CLASS): Promise<string> {
    const ai = this.getClient();
    
    // Improved prompt structure using systemInstruction as per guidelines.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Input Code:\n${inputCode}`,
      config: {
        systemInstruction: `
          Convert the following Unreal Engine C++ or Blueprint pseudo-code into a Mermaid.js ${targetType} diagram.
          
          CRITICAL RULES:
          1. Use ONLY alphanumeric characters and underscores for member names.
          2. DO NOT use asterisks (*) for pointers. Replace them with nothing or "Ptr". 
             Example: instead of "UCameraComponent* Camera", use "UCameraComponent Camera".
          3. Handle inheritance correctly (e.g., ACharacter -> AActor).
          4. Return ONLY the raw code, starting with "${targetType}". 
          5. Ensure correct Mermaid classDiagram syntax. Do not include quotes unless necessary for the class name.
        `,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    // Use .text property access (not a method).
    return response.text?.trim() || '';
  }

  async analyzeArchitecture(diagramCode: string): Promise<any> {
    const ai = this.getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Diagram Code:\n${diagramCode}`,
      config: {
        systemInstruction: `
          Analyze this Unreal Engine architecture (Mermaid diagram format) and suggest improvements.
          Focus on:
          - Memory management (Object lifetimes)
          - Blueprint vs C++ optimization
          - Design patterns (Subsystems, Components, Data Assets)
        `,
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

    // Use .text property access.
    const text = response.text || '{}';
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response", text);
      return { 
        refactorSuggestions: ["Erro ao processar sugestões da IA"], 
        complexityScore: 5, 
        potentialIssues: ["Falha na análise estrutural"] 
      };
    }
  }
}

export const geminiService = new GeminiService();
