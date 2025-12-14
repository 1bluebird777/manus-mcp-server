# Manus MCP Server - Integration Guide

## 🎯 Overview

The Manus MCP Server enables Leiah (ElevenLabs AI agent) to call Manus AI directly for real-time development tasks during customer conversations.

## 🚀 Server Status

**Status:** ✅ Running  
**Public URL:** `https://3001-i4vk8sbjvhj2iwkhvm042-ae1e241c.manusvm.computer`  
**Version:** 1.0.0  
**Port:** 3001  

## 📡 Endpoints

- **Root:** `GET /` - Server information and available tools
- **Health Check:** `GET /health` - Server health status
- **SSE Connection:** `GET /sse` - MCP SSE endpoint for ElevenLabs
- **Message Handler:** `POST /message` - Message processing endpoint

## 🛠️ Available Tools

### 1. create_task
**Description:** Create a development task for Manus AI to execute

**Parameters:**
- `task_description` (required): Clear description of what needs to be built or fixed
- `priority` (optional): "low" | "medium" | "high" | "urgent"
- `context` (optional): Additional context about the task

**Example:**
```json
{
  "task_description": "Add a tip field to the booking form with 15%, 18%, 20% options",
  "priority": "high",
  "context": "Customer requested this feature during booking"
}
```

### 2. query_project_status
**Description:** Check current BluebirdX project status

**Parameters:**
- `query_type` (required): "recent_changes" | "active_features" | "system_health" | "todo_list"

**Example:**
```json
{
  "query_type": "active_features"
}
```

### 3. get_code_context
**Description:** Get information about specific code files

**Parameters:**
- `file_path` (required): Path to file (e.g., "client/src/pages/Home.tsx")
- `query` (optional): Specific question about the code

**Example:**
```json
{
  "file_path": "client/src/pages/VoiceBookingForm.tsx",
  "query": "How does the form validation work?"
}
```

## 🔗 Add to ElevenLabs

### Step 1: Go to Integrations
Navigate to: [https://elevenlabs.io/app/agents/integrations](https://elevenlabs.io/app/agents/integrations)

### Step 2: Add Custom MCP Server

Click "Add Custom MCP Server" and fill in:

**Name:**
```
Manus AI Developer
```

**Description:**
```
AI development assistant that can build features, fix bugs, and manage the BluebirdX codebase in real-time
```

**Server Type:**
```
SSE (Server-Sent Events)
```

**Server URL:**
```
https://3001-i4vk8sbjvhj2iwkhvm042-ae1e241c.manusvm.computer/sse
```

**Secret Token:**
```
(Leave blank - no authentication required for testing)
```

**HTTP Headers:**
```
(Leave blank)
```

### Step 3: Configure Tool Approval

**Tool Approval Mode:** `Always Ask` (recommended for testing)

This means Leiah will request your permission before calling any Manus tools.

### Step 4: Trust the Server

✅ Check "I trust this server"

### Step 5: Add Server

Click "Add Server" button

## ✅ Verification

After adding the server, ElevenLabs will:
1. Test the connection to the SSE endpoint
2. Discover the 3 available tools
3. Show them in the Tools list

You should see:
- ✅ create_task
- ✅ query_project_status  
- ✅ get_code_context

## 🧪 Test the Integration

### Test 1: Query Project Status

Talk to Leiah:
```
"Can you check the current project status?"
```

Leiah should:
1. Call `query_project_status` tool
2. Ask for your approval
3. Return the current status

### Test 2: Create a Task

Talk to Leiah:
```
"Can you ask the development team to add a notes field to the booking form?"
```

Leiah should:
1. Call `create_task` tool
2. Pass the task description
3. Return a task ID and confirmation

### Test 3: Get Code Context

Talk to Leiah:
```
"What's in the VoiceBookingForm component?"
```

Leiah should:
1. Call `get_code_context` tool
2. Request information about the file
3. Return code analysis

## 🔐 Security Notes

**Current Setup (Testing):**
- ❌ No authentication
- ❌ No rate limiting
- ✅ Tool approval required

**For Production:**
- ✅ Add secret token authentication
- ✅ Implement rate limiting
- ✅ Use HTTPS (already enabled)
- ✅ Add request logging
- ✅ Implement fine-grained tool approval

## 🚨 Troubleshooting

### Connection Failed
- Check server is running: `curl https://3001-i4vk8sbjvhj2iwkhvm042-ae1e241c.manusvm.computer/health`
- Verify SSE endpoint: `curl https://3001-i4vk8sbjvhj2iwkhvm042-ae1e241c.manusvm.computer/sse`

### Tools Not Discovered
- Ensure server type is set to "SSE"
- Check URL ends with `/sse`
- Verify server logs for errors

### Tool Calls Failing
- Check Leiah has approval to use tools
- Verify tool parameters match schema
- Review server logs for errors

## 📊 Server Logs

View server logs:
```bash
tail -f /home/ubuntu/manus-mcp-server/mcp-server.log
```

## 🔄 Restart Server

If needed:
```bash
# Kill existing process
pkill -f "node index.js"

# Start new process
cd /home/ubuntu/manus-mcp-server
nohup npm start > mcp-server.log 2>&1 &
```

## 📈 Next Steps

1. ✅ Add Manus MCP to ElevenLabs
2. ✅ Test all 3 tools with Leiah
3. ✅ Add Supabase MCP for database access
4. ✅ Connect Maps MCP for pricing
5. ✅ Test complete end-to-end booking flow

## 🎯 Expected Impact

**Before MCP:**
- ❌ Leiah can't access database
- ❌ Can't create real bookings
- ❌ Can't fix bugs or add features
- ❌ Static, non-improving system

**After MCP:**
- ✅ Leiah can call Manus for development
- ✅ Real-time feature building
- ✅ Instant bug fixes
- ✅ Self-improving platform

---

**Built with ❤️ for BluebirdX**  
**Powered by Manus AI & ElevenLabs**
