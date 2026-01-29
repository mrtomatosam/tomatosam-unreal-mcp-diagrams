
import { GoogleGenAI, Type } from "@google/genai";
import { BlueprintGraph, PinType } from "../types";

const blueprintSchema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['EVENT', 'FUNCTION', 'VARIABLE', 'CONTROL_FLOW'] },
          inputs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: Object.values(PinType) }
              },
              required: ['id', 'name', 'type']
            }
          },
          outputs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: Object.values(PinType) }
              },
              required: ['id', 'name', 'type']
            }
          },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            },
            required: ['x', 'y']
          }
        },
        required: ['id', 'title', 'type', 'inputs', 'outputs', 'position']
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          fromNodeId: { type: Type.STRING },
          fromPinId: { type: Type.STRING },
          toNodeId: { type: Type.STRING },
          toPinId: { type: Type.STRING }
        },
        required: ['id', 'fromNodeId', 'fromPinId', 'toNodeId', 'toPinId']
      }
    }
  },
  required: ['nodes', 'edges']
};

export const generateBlueprint = async (prompt: string, customApiKey?: string): Promise<BlueprintGraph> => {
  const apiKey = customApiKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please select a key.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Crie um gráfico de Blueprint do Unreal Engine para: "${prompt}".
      REGRAS:
      1. Planeje o layout horizontalmente da esquerda para a direita.
      2. Use pinos de EXEC para conectar o fluxo de controle.
      3. Use tipos de dados realistas (FLOAT para HP, BOOLEAN para checks, etc).
      4. Posicione os nós em uma grade de 400px.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintSchema,
        thinkingConfig: { thinkingBudget: 4000 },
        maxOutputTokens: 10000
      },
    });

    if (!response.text) throw new Error("Resposta vazia da IA");
    return JSON.parse(response.text) as BlueprintGraph;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_NOT_FOUND");
    }
    console.error("Erro ao gerar via Web:", error);
    throw error;
  }
};
