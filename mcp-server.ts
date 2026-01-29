
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI, Type } from "@google/genai";
import process from "node:process";

// Blueprint Schema for Gemini response validation
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
    version: "1.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("[MCP] Claude requested tool list");
  return {
    tools: [
      {
        name: "generate_unreal_blueprint",
        description: "Generates an Unreal Engine Blueprint visual script graph and updates the live visualizer app automatically.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The logic description (e.g. 'A light toggle system')",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

async function broadcastToApp(data: any) {
  try {
    const response = await fetch('http://localhost:5173/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (e) {
    console.error(`[MCP] Sync Broadcast Failed: Ensure web app is running at http://localhost:5173`);
    return false;
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "generate_unreal_blueprint") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const prompt = String(request.params.arguments?.prompt);
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("[MCP] Error: API_KEY environment variable is missing!");
    return {
      content: [{ type: "text", text: "Error: API_KEY is missing in Claude's MCP configuration." }],
      isError: true,
    };
  }

  console.error(`[MCP] Processing prompt: ${prompt}`);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Switched to Flash for better availability/speed
      contents: `Generate an Unreal Engine Blueprint visual scripting graph for: "${prompt}". 
      Return structured JSON data only. Include positions, pins, and connections.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const blueprintData = JSON.parse(text);
    const syncSuccess = await broadcastToApp(blueprintData);

    return {
      content: [
        {
          type: "text",
          text: syncSuccess 
            ? `Blueprint generated and synced to visualizer for: ${prompt}`
            : `Blueprint generated for: ${prompt}. (Manual sync required - web app not detected at :5173)`,
        },
        {
          type: "text",
          text: text,
        },
      ],
    };
  } catch (error: any) {
    console.error(`[MCP] Tool Execution Error: ${error.message}`);
    return {
      content: [{ type: "text", text: `AI Generation Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] Unreal Blueprint Server successfully connected to stdio");
  
  if (!process.env.API_KEY) {
    console.error("[MCP] WARNING: No API_KEY found. Tool calls will fail.");
  }
}

main().catch((error) => {
  console.error("[MCP] Critical Server Error:", error);
  process.exit(1);
});
