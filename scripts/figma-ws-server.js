/**
 * WebSocket server for Cursor Talk to Figma MCP.
 * Compatible with the Figma plugin & MCP protocol (port 3055).
 * Run: npm run figma-socket
 */
const http = require("http");
const WebSocket = require("ws");

const PORT = 3055;
const HOST = "0.0.0.0"; // allow Figma Desktop on same machine (and WSL if needed)

const channels = new Map(); // channelName -> Set<WebSocket>

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log("New client connected");

  send(ws, {
    type: "system",
    message: "Please join a channel to start chatting",
  });

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      console.log("\n=== Received ===", "Type:", data.type, "Channel:", data.channel || "N/A");
      if (data.message?.command) console.log("Command:", data.message.command, "ID:", data.message.id || data.id);

      if (data.type === "join") {
        const channelName = data.channel;
        if (!channelName || typeof channelName !== "string") {
          send(ws, { type: "error", message: "Channel name is required" });
          return;
        }
        if (!channels.has(channelName)) channels.set(channelName, new Set());
        const channelClients = channels.get(channelName);
        channelClients.add(ws);
        console.log("✓ Client joined channel \"" + channelName + "\" (" + channelClients.size + " total)");

        send(ws, { type: "system", message: "Joined channel: " + channelName, channel: channelName });
        send(ws, { type: "system", message: { id: data.id, result: "Connected to channel: " + channelName }, channel: channelName });

        channelClients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            send(client, { type: "system", message: "A new user has joined the channel", channel: channelName });
          }
        });
        return;
      }

      if (data.type === "message") {
        const channelName = data.channel;
        if (!channelName || typeof channelName !== "string") {
          send(ws, { type: "error", message: "Channel name is required" });
          return;
        }
        const channelClients = channels.get(channelName);
        if (!channelClients || !channelClients.has(ws)) {
          send(ws, { type: "error", message: "You must join the channel first" });
          return;
        }
        let count = 0;
        channelClients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            count++;
            send(client, { type: "broadcast", message: data.message, sender: "peer", channel: channelName });
          }
        });
        if (count === 0) console.log("⚠ No other clients in channel \"" + channelName + "\" to receive message");
        else console.log("✓ Broadcast to " + count + " peer(s) in \"" + channelName + "\"");
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  ws.on("close", () => {
    channels.forEach((clients, channelName) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            send(client, { type: "system", message: "A user has left the channel", channel: channelName });
          }
        });
      }
    });
    console.log("Client disconnected");
  });
});

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
    res.end("WebSocket server running (Cursor Talk to Figma). Connect on ws://" + (HOST === "0.0.0.0" ? "localhost" : HOST) + ":" + PORT);
    return;
  }
  res.writeHead(404);
  res.end();
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

server.listen(PORT, HOST, () => {
  console.log("Figma MCP WebSocket server running on ws://" + (HOST === "0.0.0.0" ? "localhost" : HOST) + ":" + PORT);
  console.log("Keep this terminal open. Then: open Figma Desktop -> run plugin -> join channel.");
});
