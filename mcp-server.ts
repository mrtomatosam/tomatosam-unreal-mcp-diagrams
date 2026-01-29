
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI, Type } from "@google/genai";
import process from "node:process";

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
    version: "1.4.0",
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
        description: "Gera um gráfico de script visual do Unreal Engine e atualiza automaticamente o visualizador web.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Descrição da lógica (ex: 'Sistema de pulo duplo com stamina')",
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
    console.error("[MCP] Falha ao sincronizar: O app web está rodando em http://localhost:5173?");
    return false;
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "generate_unreal_blueprint") {
    throw new Error(`Tool desconhecida: ${request.params.name}`);
  }

  const prompt = String(request.params.arguments?.prompt);
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return {
      content: [{ type: "text", text: "Erro: API_KEY faltando na configuração do Claude." }],
      isError: true,
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um gráfico de Blueprint do Unreal Engine para: "${prompt}". 
      Retorne APENAS JSON estruturado. Inclua posições X/Y realistas, pinos de EXEC e tipos de dados (BOOLEAN, FLOAT, etc).`,
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
            ? `Blueprint gerado e enviado para o visualizador!`
            : `Blueprint gerado, mas o visualizador não foi encontrado em :5173. Cole o JSON manualmente se necessário.`,
        },
        {
          type: "text",
          text: response.text,
        },
      ],
    };
  } catch (error: any) {
    console.error(`[MCP] Erro: ${error.message}`);
    return {
      content: [{ type: "text", text: `Erro na IA: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] Servidor Unreal Blueprint rodando via Stdio.");
}

main().catch((error) => {
  console.error("[MCP] Erro fatal:", error);
  process.exit(1);
});
