
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
      model: 'gemini-3-flash-preview', // Consistent with MCP
      contents: `Generate an Unreal Engine Blueprint visual scripting graph for: "${prompt}". 
      Position nodes realistically. Include EXEC pins and connections.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(response.text) as BlueprintGraph;
  } catch (error) {
    console.error("Error generating blueprint:", error);
    throw error;
  }
};
