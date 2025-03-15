import { ClientDisconnectMessage, ClientUpdateMessage, InitMessage, Message, SyncStateMessage } from "../common/types";

interface Connection {
	send: (message: ClientUpdateMessage) => void;
	close: () => void;
}

export const createConnection = (
	url: string,
	onInit: (message: InitMessage) => void,
	onSyncState: (message: SyncStateMessage) => void,
	onClientDisconnect: (message: ClientDisconnectMessage) => void,
): Connection => {
	const socket = new WebSocket(url);
	socket.addEventListener("message", ({ data }) => {
		const message = JSON.parse(data) as Message;
		switch (message.type) {
			case "init": return onInit(message as InitMessage);
			case "client-disconnect": return onClientDisconnect(message as ClientDisconnectMessage);
			case "sync-state": return onSyncState(message as SyncStateMessage);
		}
	});

	return {
		send: (data) => socket.send(JSON.stringify(data)),
		close: () => socket.close(),
	};
};
