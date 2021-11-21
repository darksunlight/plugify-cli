import { Command, CommandExecuteArguments } from "@/types";

export class HelpCommand implements Command {
    public data = {
        name: "help",
        aliases: [],
        description: "Display a list of commands"
    }
    public execute({ line, client }: CommandExecuteArguments): void {
        if (line.length === 1) {
            const commands = client.commandHandler.commandsWithoutAliases;
            return console.log("List of commands:\n".concat([...commands.keys()].map(x => `${client.commandPrefix}${x}${commands.get(x)!.data.description ? " - ".concat(commands.get(x)!.data.description!) : ""}`).join("\n")));
        }
        const commands = client.commandHandler.commands;
        const command = commands.get(line[1]);
        if (!command) return console.log(`No command exists with the name ${line[1]}.`);
        const output = [];
        output.push(`${command.data.name} command`.toUpperCase(), "====");
        output.push(command.data.description);
        if (command.data.expectArg) {
            output.push(`Subcommands: ${command.data.expectArg.split(" ").join(", ")}`);
        }
        return console.log(output.join("\n"));
    }
    constructor() {}
}