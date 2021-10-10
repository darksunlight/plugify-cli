import { Command, CommandExecuteArguments } from "@/types";

export class ChannelsCommand implements Command {
    public data = {
        name: "channels",
        aliases: [],
        description: "List channels"
    }
    public execute({ line, client }: CommandExecuteArguments): void {
        if (line[1]) {
            if (!client.groups.get(line[1])) return console.log("Please provide a valid group ID");
            if (!client.groups.get(line[1])!.channels) return console.log(`Soemthing went wrong. Please restart Plugify CLI. Details: No channels cached for group ${line[1]}`);
            return console.log([...client.groups.get(line[1])!.channels!.values()].map(x => `${x.id} - #${x.name}`).join("\n"));
        } else if (client.focusedGroup) {
            return console.log([...client.groups.get(client.focusedGroup)!.channels!.values()].map(x => `${x.id} - #${x.name}`).join("\n"));
        }
        console.log("Since you are not currently focusing on any groups, all channels from all groups have been listed below.");
        return console.log([...client.channels.values()].map(x => `${x.id} - #${x.name}`).join("\n"));
    }
    constructor() {}
}