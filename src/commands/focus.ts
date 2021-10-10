import { Command, CommandExecuteArguments } from "@/types";

export class FocusCommand implements Command {
    public data = {
        name: "focus",
        aliases: [],
        description: "Focus on a group"
    }
    public execute({ line, client }: CommandExecuteArguments): void {
        if (!line[1]) return console.log("Please supply a valid group ID.");
        const group = client.groups.get(line[1]);
        if (!group) return console.log(`Please supply a valid group ID or run \`${client.commandPrefix}groups fetch\` to update your group list.`);
        client.focusedGroup = group.id;
        console.log(`Now focusing on ${group.name} (${group.id})`);
    }
    constructor() {}
}