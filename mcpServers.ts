
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI, Type } from "@google/genai";
// Explicitly import process from node:process to resolve typing conflicts for process.exit
import process from "node:process";

// Reuse the schema from the frontend for consistency
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
                type: { type: Type.STRING }
              }
            }
          },
          outputs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING }
              }
            }
          },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            }
          }
        }
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
        }
      }
    }
  }
};

const server = new Server(
  {
    name: "unreal-blueprint-generator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_unreal_blueprint",
        description: "Generates a structured JSON representation of an Unreal Engine Blueprint visual script graph based on a natural language description.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The description of the logic to generate (e.g., 'A health system with damage logic')",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "generate_unreal_blueprint") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const prompt = String(request.params.arguments?.prompt);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate an Unreal Engine Blueprint visual scripting graph for: "${prompt}". 
      Return structured JSON data only. Include positions, pins (EXEC, BOOLEAN, etc), and connections.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintSchema,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully generated Blueprint data for: ${prompt}. You can visualize this JSON in the Unreal Script Visualizer web app.`,
        },
        {
          type: "text",
          text: response.text || "{}",
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error generating blueprint: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Unreal Blueprint MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  // Using imported process to ensure .exit is available
  process.exit(1);
});
