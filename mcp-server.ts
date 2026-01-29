
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI, Type } from "@google/genai";
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
    version: "1.1.0",
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
        description: "Generates a structured JSON representation of an Unreal Engine Blueprint visual script graph. The graph is automatically pushed to the visualizer web app.",
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

async function broadcastToApp(data: any) {
  try {
    // Attempt to push to the local Vite sync endpoint
    const response = await fetch('http://localhost:5173/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

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

    const blueprintData = JSON.parse(response.text || "{}");
    const syncSuccess = await broadcastToApp(blueprintData);

    return {
      content: [
        {
          type: "text",
          text: syncSuccess 
            ? `Successfully generated Blueprint for: ${prompt}. The visualizer has been updated automatically!`
            : `Generated Blueprint for: ${prompt}. (Automatic sync failed - ensure the web app is running at http://localhost:5173). You can also paste the JSON manually.`,
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
  console.error("Unreal Blueprint MCP Server (Sync-Enabled) running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
