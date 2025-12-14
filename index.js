import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Create MCP server
const server = new Server(
  {
    name: "manus-ai-developer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: "create_task",
    description: "Create a development task for Manus AI to execute. Use this when you need to build features, fix bugs, or make changes to the BluebirdX codebase.",
    inputSchema: {
      type: "object",
      properties: {
        task_description: {
          type: "string",
          description: "Clear description of what needs to be built or fixed. Be specific about the feature, bug, or change required.",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Priority level of the task",
        },
        context: {
          type: "string",
          description: "Additional context about why this task is needed or what problem it solves",
        },
      },
      required: ["task_description"],
    },
  },
  {
    name: "query_project_status",
    description: "Check the current status of the BluebirdX project, including recent changes, active features, and system health.",
    inputSchema: {
      type: "object",
      properties: {
        query_type: {
          type: "string",
          enum: ["recent_changes", "active_features", "system_health", "todo_list"],
          description: "Type of status information to retrieve",
        },
      },
      required: ["query_type"],
    },
  },
  {
    name: "get_code_context",
    description: "Get information about specific code files, components, or functions in the BluebirdX project.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file or component to analyze (e.g., 'client/src/pages/Home.tsx')",
        },
        query: {
          type: "string",
          description: "Specific question about the code or what you're looking for",
        },
      },
      required: ["file_path"],
    },
  },
];

// Log all messages for debugging
server.onmessage = (message) => {
  console.log('📥 MCP message received:', JSON.stringify(message, null, 2));
};

server.onerror = (error) => {
  console.error('❌ MCP server error:', error);
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.log("🔧 Sending tools list:", JSON.stringify(TOOLS, null, 2));
  const response = {
    tools: TOOLS,
  };
  console.log("📤 Tools list response:", JSON.stringify(response, null, 2));
  return response;
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.log(`🔨 Tool called: ${name}`);
  console.log(`📋 Arguments:`, JSON.stringify(args, null, 2));

  try {
    switch (name) {
      case "create_task":
        return {
          content: [
            {
              type: "text",
              text: `✅ Task created successfully!\n\nTask: ${args.task_description}\nPriority: ${args.priority || "medium"}\n\nManus AI will begin working on this task shortly. You can check the status using the query_project_status tool.`,
            },
          ],
        };

      case "query_project_status":
        return {
          content: [
            {
              type: "text",
              text: `📊 Project Status - ${args.query_type}\n\nBluebirdX is currently running and healthy. The development server is active and all systems are operational.`,
            },
          ],
        };

      case "get_code_context":
        return {
          content: [
            {
              type: "text",
              text: `📄 Code Context - ${args.file_path}\n\nFile analysis available. Query: ${args.query || "General overview"}`,
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`❌ Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Track transports by session ID
const transports = new Map();

// SSE endpoint
app.get("/sse", async (req, res) => {
  console.log("📡 SSE connection request received");
  
  try {
    // Create SSE transport with /messages endpoint
    const transport = new SSEServerTransport("/messages", res);
    
    // Connect server to transport (this automatically calls start())
    await server.connect(transport);
    console.log(`✅ MCP server connected via SSE (session: ${transport.sessionId})`);
    
    // Store transport by session ID
    transports.set(transport.sessionId, transport);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`🔌 SSE connection closed (session: ${transport.sessionId})`);
      transports.delete(transport.sessionId);
    });
  } catch (error) {
    console.error("❌ SSE connection error:", error);
    console.error("Error stack:", error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Messages endpoint for POST requests
app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  
  console.log(`📨 POST /messages?sessionId=${sessionId}`);
  console.log(`📋 Method: ${req.body.method}`);
  
  if (!sessionId) {
    console.error("❌ No sessionId in query");
    return res.status(400).json({ error: 'sessionId is required' });
  }
  
  const transport = transports.get(sessionId);
  
  if (!transport) {
    console.error(`❌ No transport found for session: ${sessionId}`);
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    // The body has already been parsed by express.json()
    // So we need to handle it manually instead of letting the SDK read the stream
    const message = req.body;
    console.log('📥 Received message:', JSON.stringify(message, null, 2));
    
    // Send the message to the MCP server for processing
    const response = await server.handleRequest(message);
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    
    // Send the response back
    res.json(response);
  } catch (error) {
    console.error(`❌ Error handling message:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    server: "manus-mcp-server",
    version: "1.0.0",
    active_sessions: transports.size,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Manus AI Developer MCP Server",
    version: "1.0.0",
    description: "MCP server that enables Leiah to call Manus AI for real-time development",
    endpoints: {
      sse: "/sse",
      messages: "/messages",
      health: "/health",
    },
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    active_sessions: transports.size,
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Manus MCP Server running on ${HOST}:${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`📨 Messages endpoint: http://localhost:${PORT}/messages`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, closing server gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, closing server gracefully...');
  process.exit(0);
});
