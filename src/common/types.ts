export interface Client {
	id: string;
	position: { x: number; y: number };
	colour: string;
}

export interface Message {
	type: "init" | "client-update" | "sync-state";
}

export interface InitMessage extends Message {
	type: "init";
	id: string;
}

export interface ClientUpdateMessage extends Message {
	type: "client-update",
	position: { x: number; y: number };
	colour: string;
}

export interface SyncStateMessage extends Message {
	type: "sync-state";
	clients: Client[];
}
