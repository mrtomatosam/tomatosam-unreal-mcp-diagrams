
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
    // Fixed: Initializing GoogleGenAI inside the function with correct parameter format to ensure latest API key usage
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate an Unreal Engine Blueprint visual scripting graph for the following requirement: "${prompt}". 
      Make sure to include appropriate node types: 
      - EVENT (e.g., BeginPlay, OnComponentHit)
      - FUNCTION (e.g., PrintString, SetActorLocation)
      - CONTROL_FLOW (e.g., Branch, Delay)
      - VARIABLE (e.g., Get Player Health).
      Ensure execution pins (EXEC type) are connected correctly in sequence.
      Position nodes realistically from left to right.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintSchema,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    // Fixed: Accessing response.text directly (property, not method)
    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(response.text) as BlueprintGraph;
  } catch (error) {
    console.error("Error generating blueprint:", error);
    throw error;
  }
};
