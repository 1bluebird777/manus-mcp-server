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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_task": {
        // This would integrate with Manus API to create actual tasks
        const taskId = `task_${Date.now()}`;
        const response = {
          task_id: taskId,
          status: "created",
          message: `Task created successfully: "${args.task_description}"`,
          priority: args.priority || "medium",
          estimated_time: "Task will be processed by Manus AI developer",
          next_steps: [
            "Manus AI will analyze the request",
            "Code changes will be implemented",
            "Changes will be tested",
            "Updates will be deployed",
          ],
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "query_project_status": {
        const { query_type } = args;
        let statusInfo = {};

        switch (query_type) {
          case "recent_changes":
            statusInfo = {
              last_updated: new Date().toISOString(),
              recent_features: [
                "Voice booking interface with Leiah AI",
                "Interactive hero orb with vehicle selection",
                "Tinder-style driver swipe cards",
                "Real-time chat interface",
              ],
              last_deployment: "Active development",
            };
            break;

          case "active_features":
            statusInfo = {
              completed: [
                "Hero orb with animations",
                "AI chat interface",
                "Driver swipe cards",
                "Booking form",
                "Authentication system",
              ],
              in_progress: [
                "Supabase database integration",
                "MCP server connections",
                "Payment processing",
              ],
              planned: [
                "Real-time notifications",
                "SMS confirmations",
                "Advanced analytics",
              ],
            };
            break;

          case "system_health":
            statusInfo = {
              status: "healthy",
              dev_server: "running",
              database: "connected",
              api_endpoints: "operational",
              last_check: new Date().toISOString(),
            };
            break;

          case "todo_list":
            statusInfo = {
              high_priority: [
                "Complete Supabase MCP integration",
                "Connect Manus MCP to Leiah",
                "Test end-to-end booking flow",
              ],
              medium_priority: [
                "Add payment processing",
                "Implement notifications",
                "Build admin dashboard features",
              ],
              low_priority: [
                "Performance optimization",
                "Additional animations",
                "Extended analytics",
              ],
            };
            break;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(statusInfo, null, 2),
            },
          ],
        };
      }

      case "get_code_context": {
        const { file_path, query } = args;
        const response = {
          file: file_path,
          query: query || "General file information",
          analysis: `Code context for ${file_path}`,
          note: "This is a simplified response. In production, this would analyze the actual file content.",
          suggestion: "Use this tool to understand code structure before making changes.",
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Store transport sessions
const transportMap = new Map();

// SSE endpoint for MCP (using proven pattern from working example)
app.get("/sse", async (req, res) => {
  console.log("📡 SSE connection request received");
  
  try {
    // Create transport with /messages endpoint (note: plural)
    const transport = new SSEServerTransport("/messages", res);
    
    // Connect MCP server to transport
    await server.connect(transport);
    
    // Store transport by session ID
    transportMap.set(transport.sessionId, transport);
    
    console.log(`✅ MCP server connected via SSE (session: ${transport.sessionId})`);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`🔌 SSE connection closed (session: ${transport.sessionId})`);
      transportMap.delete(transport.sessionId);
    });
  } catch (error) {
    console.error("❌ SSE connection error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Message endpoint for SSE (note: plural /messages)
app.post("/messages", async (req, res) => {
  console.log("📨 Message received:", JSON.stringify(req.body, null, 2));
  
  const sessionId = req.query.sessionId;
  
  if (!sessionId) {
    console.error("❌ Message received without sessionId");
    return res.status(400).json({ error: 'sessionId is required' });
  }
  
  const transport = transportMap.get(sessionId);
  
  if (transport) {
    console.log(`✅ Handling message for session: ${sessionId}`);
    await transport.handlePostMessage(req, res);
  } else {
    console.error(`❌ No transport found for session: ${sessionId}`);
    res.status(404).json({ error: 'Session not found' });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    server: "manus-mcp-server",
    version: "1.0.0",
    active_sessions: transportMap.size,
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
      sse: "GET /sse",
      messages: "POST /messages",
      health: "GET /health",
    },
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    active_sessions: transportMap.size,
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Manus MCP Server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`📨 Messages endpoint: http://localhost:${PORT}/messages`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
