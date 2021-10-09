import { Command, CommandExecuteArguments, GatewayEvent } from "@/types";

export class JoinCommand implements Command {
    public data = {
        name: "join",
        aliases: []
    }
    public execute({ line, client }: CommandExecuteArguments): void {
        if (!line[1]) return console.log("Please specify a channel ID or channel name.");
        if (line[1].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
            client.gateway.send(GatewayEvent.CHANNEL_JOIN, { id: line[1] });
        } else if (client.focusedGroup && client.groups.get(client.focusedGroup)?.channels) {
            const matchedChannels = [...client.groups.get(client.focusedGroup)!.channels!].map(x => x[1]).filter(x => x.name === line[1]);
            if (matchedChannels.length < 1) return console.log("No channel with this name exist in this group.");
            client.gateway.send(GatewayEvent.CHANNEL_JOIN, { id: matchedChannels[0].id });
        } else {
            console.log("Please specify a valid channel ID or join a group first.");
        }
    }
    constructor() {}
}