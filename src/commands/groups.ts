import { Command, CommandExecuteArguments } from "@/types";

export class GroupsCommand implements Command {
    public data = {
        name: "groups",
        aliases: []
    }
    public execute({ client }: CommandExecuteArguments): void {
        console.log([...client.groups.values()].map(x => `${x.id} - ${x.name}`).join("\n"));
    }
    constructor() {}
}