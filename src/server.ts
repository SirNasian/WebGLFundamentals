import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";

import { Client, InitMessage } from "./common/types";

const clients: Record<string, Client> = {};
const sockets: Record<string, WebSocket> = {};

const server = new WebSocketServer({ port: 3001 });

server.on("connection", (socket) => {
	socket.on("open", () => {
		const client_id = uuid();

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
	});

	socket.on("message", console.debug);
});
