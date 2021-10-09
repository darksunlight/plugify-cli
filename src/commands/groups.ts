import { Command, CommandExecuteArguments, GatewayEvent } from "@/types";

export class GroupsCommand implements Command {
    public data = {
        name: "groups",
        aliases: [],
        expectArg: "fetch"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (line[1] && line[1] === "fetch") { return await client.gateway.send(GatewayEvent.GROUP_GET_REQUEST, null); } 
        console.log([...client.groups.values()].map(x => `${x.id} - ${x.name}`).join("\n"));
    }
    constructor() {}
}