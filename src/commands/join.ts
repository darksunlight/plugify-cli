import { Client } from "@/client";
import { AllRoomsSupport, Command, CommandExecuteArguments, GatewayEvent } from "@/types";

export class JoinCommand implements Command {
    public data = {
        name: "join",
        aliases: [],
        description: "Join a channel",
        allRooms: AllRoomsSupport.Modified
    }
    public execute({ line, client }: CommandExecuteArguments): void {
        if (!line[1]) return console.log("Please specify a channel ID or channel name.");
        if (line[1].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
            if (client.allRooms) return this.allRoomsJoin(client, line[1]);
            client.gateway.send(GatewayEvent.CHANNEL_JOIN, { id: line[1] });
        } else if (client.focusedGroup && client.groups.get(client.focusedGroup)?.channels) {
            const matchedChannels = [...client.groups.get(client.focusedGroup)!.channels!].map(x => x[1]).filter(x => x.name === line[1]);
            if (matchedChannels.length < 1) return console.log("No channel with this name exist in this group.");
            if (client.allRooms) return this.allRoomsJoin(client, matchedChannels[0].id);
            client.gateway.send(GatewayEvent.CHANNEL_JOIN, { id: matchedChannels[0].id });
        } else {
            console.log("Please specify a valid channel ID or join a group first.");
        }
    }
    private allRoomsJoin(client: Client, id: string): void {
        const channel = client.channels.get(id);
        if (!channel) return console.log("This channel doesn't exist or isn't cached yet.");
        let group = client.groups.get(channel.groupID);
        if (!group) client.gateway.send(GatewayEvent.GROUP_GET_REQUEST, null);
        client.focusedGroup = channel.groupID;
        client.joinedChannel = channel.id;
        client.prompt.setPrompt(`${client.user.displayName ?? client.user.username}, #${channel.name}> `);
        group = client.groups.get(channel.groupID);
        console.log(`You are now focusing on #${channel.name} (${channel.id})${group ? ` in ${group.name}` : ""}`);
    }
    constructor() {}
}