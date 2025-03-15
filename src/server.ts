import * as fs from "fs";
import * as http from "http";
import * as mime from "mime-types";
import * as path from "path";

import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";

import { Client, ClientDisconnectMessage, ClientUpdateMessage, InitMessage, Message, SyncStateMessage } from "./common/types";

const HTTP_PORT = Number(process.env.HTTP_PORT ?? 3000);
const WS_PORT = Number(process.env.WS_PORT ?? 3001);
console.debug({ HTTP_PORT, WS_PORT });

http.createServer(async (req, res) => {
	const urlpath = req.url.split("?")[0];
	const filepath = path.join(".", "public", urlpath === "/" ? "index.html" : urlpath);
	const stats = await fs.promises.stat(filepath);

	if (!stats.isFile()) {
		res.statusCode = 404;
		res.end('File not found');
		return;
	}

	const contentType = mime.contentType(path.extname(filepath)) || 'application/octet-stream';
	res.setHeader('Content-Type', contentType);
	fs.createReadStream(filepath).pipe(res);
}).listen(HTTP_PORT);

const clients: Record<string, Client> = {};
const sockets: Record<string, WebSocket> = {};

const server = new WebSocketServer({ port: WS_PORT });

server.on("connection", (socket) => {
	const client_id = uuid();
	{
		const message: InitMessage = {
			type: "init",
			id: client_id,
		};

		clients[client_id] = {
			id: client_id,
			position: { x: 0, y: 0 },
			colour: "#FFFFFF",
		};

		socket.send(JSON.stringify(message));
		sockets[client_id] = socket;
		console.debug(`[${new Date().toISOString()}] ${client_id} CONNECTED`);
	}

	socket.on("close", () => {
		const entries = Object.entries(sockets);
		const closed_sockets = entries.filter(([, socket]) => socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED);
		const client_ids = closed_sockets.map((([id]) => id));

		client_ids.forEach((id) => {
			delete sockets[id];
			delete clients[id];
			console.debug(`[${new Date().toISOString()}] ${id} DISCONNECTED`);
		});

		Object.values(sockets).forEach((socket) =>
			client_ids.forEach((client_id) => {
				const message: ClientDisconnectMessage = {
					type: "client-disconnect",
					id: client_id,
				};
				socket.send(JSON.stringify(message));
			}));
	});

	socket.on("message", (data) => {
		const message = JSON.parse(data.toString("utf8")) as Message;
		if (message.type !== "client-update") return;
		const client = message as ClientUpdateMessage as Client;
		clients[client.id] = client;
	});

	setInterval(() => {
		const message: SyncStateMessage = {
			type: "sync-state",
			clients: Object.values(clients).filter(client => client.id !== client_id),
		};
		socket.send(JSON.stringify(message));
	}, 8);
});
