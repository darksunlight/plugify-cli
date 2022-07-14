import { Command, CommandExecuteArguments } from "@/types";

export class GatewayCommand implements Command {
    public data = {
        name: "gateway",
        aliases: [],
        description: "For developers: send events through the gateway"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log("Please supply a op code");
        client.gateway.send(parseInt(line[1]), line[2] ? JSON.parse(line.slice(2).join(" ")) : undefined);
    }
    constructor() {}
}