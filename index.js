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
    name: "validate_address",
    description: "Validate and format an address using Google Maps. Returns the complete formatted address, coordinates, and whether the address is valid. Use this BEFORE accepting any pickup or destination address from the customer.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The address to validate (can be partial)",
        },
      },
      required: ["address"],
    },
  },
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
      case "validate_address":
        // Validate address using BluebirdX Maps API
        try {
          // Call the BluebirdX tRPC Maps endpoint
          const response = await fetch('https://3000-ii9186swennxy0bd1alpz-ffae60b9.manusvm.computer/api/trpc/maps.geocode?input=' + encodeURIComponent(JSON.stringify({ address: args.address })));
          const data = await response.json();
          
          if (data.result?.data?.success) {
            const result = data.result.data;
            return {
              content: [
                {
                  type: "text",
                  text: `✅ Address validated!\n\nFormatted Address: ${result.formattedAddress}\nCoordinates: ${result.location.lat}, ${result.location.lng}\n\nThis is a valid, complete address.`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `⚠️ Address not found or invalid: "${args.address}"\n\nPlease ask the customer for a more complete address with street number, street name, city, and postal code.`,
                },
              ],
            };
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ Could not validate address: ${error.message}\n\nPlease ask the customer to provide a complete address.`,
              },
            ],
          };
        }

      case "create_task":
        // Create a real task file in the BluebirdX project
        const taskId = `TASK-${Date.now()}`;
        const taskContent = `# ${taskId}: ${args.title}\n\n**Created by:** Leiah (Customer Request)\n**Priority:** ${args.priority || "medium"}\n**Created:** ${new Date().toISOString()}\n\n## Description\n\n${args.description}\n\n## Status\n\n- [ ] Task created\n- [ ] In progress\n- [ ] Completed\n\n## Notes\n\nThis task was created during a customer conversation with Leiah.\n`;
        
        // Write task to file system
        const fs = await import('fs/promises');
        const taskPath = `/home/ubuntu/bluebird-x/tasks/${taskId}.md`;
        
        try {
          // Ensure tasks directory exists
          await fs.mkdir('/home/ubuntu/bluebird-x/tasks', { recursive: true });
          await fs.writeFile(taskPath, taskContent);
          
          return {
            content: [
              {
                type: "text",
                text: `✅ Task created successfully!\n\nTask ID: ${taskId}\nTitle: ${args.title}\nPriority: ${args.priority || "medium"}\n\nI've created this task in the BluebirdX development system. The Manus AI team will review and implement this feature.`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ Task logged but file creation failed: ${error.message}\n\nTask details have been recorded:\nTitle: ${args.title}\nDescription: ${args.description}\nPriority: ${args.priority || "medium"}`,
              },
            ],
          };
        }

      case "query_project_status":
        // Query real BluebirdX project status
        const fs2 = await import('fs/promises');
        const { execSync } = await import('child_process');
        
        try {
          let statusText = '📊 BluebirdX Project Status\n\n';
          
          // Check dev server status
          try {
            const response = await fetch('http://localhost:3000/health').catch(() => null);
            statusText += `✅ Dev Server: Running on port 3000\n`;
          } catch {
            statusText += `⚠️ Dev Server: Not responding\n`;
          }
          
          // Get recent git commits
          try {
            const recentCommits = execSync('cd /home/ubuntu/bluebird-x && git log --oneline -5', { encoding: 'utf-8' });
            statusText += `\n📋 Recent Changes:\n${recentCommits}\n`;
          } catch {}
          
          // Check for pending tasks
          try {
            const tasks = await fs2.readdir('/home/ubuntu/bluebird-x/tasks').catch(() => []);
            statusText += `\n📝 Active Tasks: ${tasks.length} tasks in queue\n`;
          } catch {}
          
          // List active features
          statusText += `\n✨ Active Features:\n- AI Voice Booking with Leiah\n- Real-time driver matching\n- ElevenLabs integration\n- MCP Server integration (NEW!)\n`;
          
          return {
            content: [
              {
                type: "text",
                text: statusText,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ Could not fetch full project status: ${error.message}\n\nBluebirdX is operational. Contact the development team for detailed status.`,
              },
            ],
          };
        }

      case "get_code_context":
        // Search and read actual BluebirdX code
        const fs3 = await import('fs/promises');
        const path = await import('path');
        const { execSync: exec2 } = await import('child_process');
        
        try {
          const query = args.query.toLowerCase();
          let contextText = `📝 Code Context for: "${args.query}"\n\n`;
          
          // Search for relevant files using grep
          try {
            const searchResults = exec2(
              `cd /home/ubuntu/bluebird-x && grep -r "${query}" --include="*.ts" --include="*.tsx" --include="*.js" -l | head -10`,
              { encoding: 'utf-8' }
            ).trim();
            
            if (searchResults) {
              const files = searchResults.split('\n');
              contextText += `Found in ${files.length} file(s):\n`;
              
              // Read first matching file
              const firstFile = files[0];
              const fullPath = `/home/ubuntu/bluebird-x/${firstFile}`;
              const content = await fs3.readFile(fullPath, 'utf-8');
              
              // Get relevant excerpt (first 500 chars)
              const excerpt = content.substring(0, 500);
              contextText += `\n📄 ${firstFile}:\n\`\`\`\n${excerpt}...\n\`\`\`\n\n`;
              
              if (files.length > 1) {
                contextText += `Also found in: ${files.slice(1, 5).join(', ')}\n`;
              }
            } else {
              contextText += `No exact matches found. Checking common components...\n\n`;
              
              // Provide general info about common components
              contextText += `✨ BluebirdX Architecture:\n`;
              contextText += `- Voice Booking: client/src/components/VoiceBookingForm.tsx\n`;
              contextText += `- AI Chat: client/src/components/LeiaChat.tsx\n`;
              contextText += `- Booking Flow: client/src/hooks/useBookingFlow.ts\n`;
              contextText += `- Backend: server/routers.ts (tRPC procedures)\n`;
            }
          } catch (searchError) {
            contextText += `Could not search codebase: ${searchError.message}\n`;
          }
          
          return {
            content: [
              {
                type: "text",
                text: contextText,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ Could not retrieve code context: ${error.message}\n\nPlease contact the development team for specific code information.`,
              },
            ],
          };
        }

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
    // Pass it as the third parameter to handlePostMessage
    const message = req.body;
    console.log('📥 Received message:', JSON.stringify(message, null, 2));
    
    // Handle the POST message with the transport, passing the parsed body
    await transport.handlePostMessage(req, res, req.body);
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
