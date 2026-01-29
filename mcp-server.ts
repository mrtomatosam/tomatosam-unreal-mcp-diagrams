
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

const server = new Server(
  {
    name: "unreal-blueprint-generator",
    version: "1.5.0",
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
        description: "Gera um gráfico de script visual do Unreal Engine profissional e completo.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Descrição detalhada da lógica desejada.",
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
    return { content: [{ type: "text", text: "Erro: API_KEY faltando." }], isError: true };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Usando Gemini 3 Pro para máxima estabilidade e janela de contexto
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Gere um gráfico de Unreal Engine Blueprint completo para: "${prompt}".
      REGRAS CRÍTICAS:
      1. Use coordenadas X/Y em uma grade de 400px (ex: 0, 400, 800) para evitar sobreposição.
      2. Garanta que TODOS os pinos de EXEC estejam conectados para formar um fluxo lógico.
      3. O JSON deve ser COMPLETO e VÁLIDO. Não abrevie nem corte a resposta.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: blueprintSchema,
        thinkingConfig: { thinkingBudget: 4000 },
        maxOutputTokens: 10000 // Aumentado para evitar truncamento
      },
    });

    const text = response.text || "{}";
    const blueprintData = JSON.parse(text);
    const syncSuccess = await broadcastToApp(blueprintData);

    return {
      content: [
        {
          type: "text",
          text: syncSuccess 
            ? `Blueprint gerado com sucesso via Gemini 3 Pro e enviado ao visualizador!`
            : `Blueprint gerado, mas o visualizador não respondeu.`,
        },
        { type: "text", text: text },
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
  console.error("[MCP] Servidor v1.5.0 (Gemini 3 Pro) ativo.");
}

main().catch(process.exit);
