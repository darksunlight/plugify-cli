import { Command, CommandExecuteArguments } from "@/types";

export class HelpCommand implements Command {
    public data = {
        name: "help",
        aliases: [],
        description: "Display a list of commands"
    }
    public execute({ client }: CommandExecuteArguments): void {
        return console.log("List of commands:\n".concat([...client.commandHandler.commandsWithoutAliases.keys()].map(x => `${client.commandPrefix}${x}${client.commandHandler.commandsWithoutAliases.get(x)!.data.description ? " - ".concat(client.commandHandler.commandsWithoutAliases.get(x)!.data.description!) : ""}`).join("\n")));
    }
    constructor() {}
}