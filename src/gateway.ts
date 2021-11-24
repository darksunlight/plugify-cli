import Websocket, { WebSocket } from "ws";
import { Client } from "@/client";
import { Channel, GatewayEvent, Group, Message } from "@/types";

export class GatewayHandler {
    public ws: WebSocket;
    public client: Client;
    constructor(client: Client) {
        this.client = client;
    }

    async init(): Promise<void> {
        this.ws = new Websocket(`ws${this.client.insecure ? "": "s"}://${this.client.apiDomain}/`);
        this.ws.onopen = () => {
            console.log("WS | Opened.");
            setInterval(() => {
                if (this.client.isDead) {
                    console.log("We lost connection with Plugify server. Quitting.");
                    process.exit(1);
                }
                this.send(GatewayEvent.PING, null);
                this.client.isDead = true; 
            }, 10000);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.ws.onmessage = async (event: any) => {
            const data = JSON.parse(event.data);
            switch (data.event) {
                case GatewayEvent.WELCOME: {
                    this.send<{ token: string; allRooms?: boolean; }>(GatewayEvent.AUTHENTICATE, {
                        token: this.client.token,
                        allRooms: this.client.allRooms ? true : undefined
                    });
                    break;
                }

                case GatewayEvent.AUTHENTICATE_SUCCESS: {
                    this.client.loggedIn = true;
                    this.client.user = data.data;
                    console.log("\nWS | Logged in.");
                    this.send(GatewayEvent.GROUP_GET_REQUEST, null);
                    this.client.prompt.setPrompt(`${this.client.user.displayName ?? this.client.user.username}, #none> `);
                    this.client.prompt.prompt();
                    this.client.prompt.startListener();
                    break;
                }

                case GatewayEvent.AUTHENTICATE_ERROR: {
                    console.log("Authentication error: %s", data.data);
                    process.exit(1);
                }

                // eslint-disable-next-line no-fallthrough
                case GatewayEvent.CHANNEL_JOIN_SUCCESS: {
                    const channel = data.data.channel as Channel;
                    const group = this.client.groups.get(channel.groupId);
                    if (!group) this.send(GatewayEvent.GROUP_GET_REQUEST, null);
                    this.client.focusedGroup = channel.groupId;
                    this.client.channels.set(channel.id, channel);
                    this.client.joinedChannel = channel.id;
                    this.client.prompt.setPrompt(`${this.client.user.displayName ?? this.client.user.username}, #${channel.name}> `);
                    if (data.data.history) data.data.history.forEach((message: Message) => this.handleMessage(message));
                    if (this.client.groups.get(channel.groupId)) {
                        console.log(`Successfully joined #${channel.name} (${channel.id}) in ${this.client.groups.get(channel.groupId)!.name}`);
                    } else {
                        console.log(`Successfully joined #${channel.name} (${channel.id})`);
                    }
                    break;
                }

                case GatewayEvent.MESSAGE_NEW: {
                    this.handleMessage(data.data as Message);
                    break;
                }

                case GatewayEvent.GROUP_GET_SUCCESS: {
                    const groups = data.data as Group[];
                    groups.forEach(async group => {
                        this.client.groups.set(group.id, group);
                        this.send(GatewayEvent.ROOMS_GET_REQUEST, { groupID: group.id });
                        /* const data = await this.client.rest.get<{ roles: Role[] }>(`/roles/group/${group.id}`);
                        if (data.data) {
                            if (!this.client.groups.get(group.id)!.roles) this.client.groups.get(group.id)!.roles = new Map();
                            data.data!.roles.forEach(role => {
                                this.client.groups.get(group.id)!.roles!.set(role.id, role);
                            });
                        } */
                    });
                    break;
                }

                case GatewayEvent.ROOMS_GET_SUCCESS: {
                    const channels = data.data as Channel[];
                    channels.forEach(channel => {
                        this.client.channels.set(channel.id, channel);
                        const group = this.client.groups.get(channel.groupId);
                        if (group) {
                            if (!group!.channels) group!.channels = new Map();
                            group!.channels!.set(channel.id, channel);
                        }
                    });
                    break;
                }

                case GatewayEvent.CHANNEL_REMOVED: {
                    console.log("Channel removed:", data.data);
                    this.client.channels.delete(data.data.id);
                    if (this.client.joinedChannel === data.data.id) {
                        this.client.joinedChannel = "";
                        this.client.prompt.setPrompt(`${this.client.user.displayName ?? this.client.user.username}, #none> `);
                    }
                    this.client.gateway.send(GatewayEvent.GROUP_GET_REQUEST, null);
                    break;
                }

                case GatewayEvent.GROUP_REMOVED: {
                    console.log("Group removed:", data.data);
                    this.client.groups.delete(data.data.id);
                    if (this.client.channels.get(this.client.joinedChannel)?.groupId === data.data.id) {
                        this.client.joinedChannel = "";
                        this.client.prompt.setPrompt(`${this.client.user.displayName ?? this.client.user.username}, #none> `);
                    }
                    if (this.client.focusedGroup === data.data.id) {
                        this.client.focusedGroup = "";
                    }
                    this.client.gateway.send(GatewayEvent.GROUP_GET_REQUEST, null);
                    break;
                }

                case GatewayEvent.CHANNEL_DISCONNECT: {
                    console.log("Channel disconnect:", data.data);
                    if (this.client.joinedChannel === data.data.id) {
                        this.client.joinedChannel = "";
                        this.client.prompt.setPrompt(`${this.client.user.displayName ?? this.client.user.username}, #none> `);
                    }
                    break;
                }

                case GatewayEvent.PING: {
                    this.client.isDead = false;
                    break;
                }

                case GatewayEvent.MESSAGE_SEND_ERROR: {
                    console.log("Failed to send message:", data.data);
                    break;
                }

                case GatewayEvent.MESSAGE_SEND_SUCCESS: {
                    break;
                }

                default: {
                    console.log("[DEBUG] WS >>", data);
                    break;
                }
            }
        };
    }

    async send<T>(event: number, data: T): Promise<void> {
        this.ws.send(JSON.stringify({
            event,
            data: data ?? undefined
        }));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async handleMessage(data: Message) {
        const author = data.author;
        // this.client.users.set(author.id, author);
        const time = new Date(data.timestamp);
        const timeString = `${time.getHours() < 10 ? "0" : ""}${time.getHours()}:${time.getMinutes() < 10 ? "0" : ""}${time.getMinutes()}`;
        let content = data.content;
        let output = "";
        if (content.match(new RegExp(`@${this.client.user.username}`))) {
            output = "\x1b[47m\x1b[30m";
        } else {
            content = content.replace(/@([a-z0-9_-]+)/gi, "\x1b[47m\x1b[30m@$1\x1b[0m");
        }
        output += `${timeString} [${author.displayName} (@${author.username})]: ${content}\x1b[0m`;
        console.log(output);
    }
    
}