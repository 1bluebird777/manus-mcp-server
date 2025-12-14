# Manus AI Developer MCP Server

An MCP (Model Context Protocol) server that enables ElevenLabs' Leiah AI agent to interact with Manus AI for real-time development tasks on the BluebirdX project.

## Features

- **SSE Transport** - Server-Sent Events for real-time communication
- **3 Tools Available:**
  - `create_task` - Create development tasks for Manus AI
  - `query_project_status` - Check project status and health
  - `get_code_context` - Get information about code files

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/manus-mcp-server)

### Manual Deployment Steps:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Project:**
   ```bash
   cd manus-mcp-server
   railway init
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Set Environment Variables (optional):**
   ```bash
   railway variables set PORT=3001
   ```

6. **Get Your Public URL:**
   ```bash
   railway domain
   ```

## Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** manus-mcp-server
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Add environment variable:
   - `PORT` = `3001`
6. Click "Create Web Service"

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

## Endpoints

- `GET /` - Server info
- `GET /health` - Health check
- `GET /sse` - SSE endpoint for MCP connection
- `POST /messages` - Message handling endpoint

## Environment Variables

- `PORT` - Server port (default: 3001)

## Connecting to ElevenLabs

Once deployed, add your MCP server to ElevenLabs:

1. Go to ElevenLabs Agents Platform → Integrations
2. Click "Add Custom MCP Server"
3. Configure:
   - **Name:** Manus AI Developer
   - **Description:** AI development assistant for BluebirdX
   - **Server URL:** `https://your-app.railway.app/sse` (or your Render URL)
   - **Transport:** SSE
   - **Secret Token:** (leave blank for now)
4. Click "Test Connection"

## Architecture

```
ElevenLabs Agent (Leiah)
    ↓
MCP Server (this)
    ↓
Manus AI Platform
    ↓
BluebirdX Project
```

## License

MIT
