
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
          type: { 
            type: Type.STRING,
            enum: ['EVENT', 'FUNCTION', 'VARIABLE', 'CONTROL_FLOW']
          },
          inputs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { 
                  type: Type.STRING,
                  enum: Object.values(PinType)
                }
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
                type: { 
                  type: Type.STRING,
                  enum: Object.values(PinType)
                }
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

export const generateBlueprint = async (prompt: string): Promise<BlueprintGraph> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um gráfico de Blueprint do Unreal Engine para: "${prompt}". 
      Posicione os nós de forma lógica e organizada. Use pinos de EXEC para fluxo e tipos corretos para dados.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintSchema,
      },
    });

    if (!response.text) {
      throw new Error("Resposta vazia da IA");
    }

    return JSON.parse(response.text) as BlueprintGraph;
  } catch (error) {
    console.error("Erro ao gerar blueprint via Web:", error);
    throw error;
  }
};
