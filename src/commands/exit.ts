import { Command } from "@/types";

export class ExitCommand implements Command {
    public data = {
        name: "exit",
        aliases: ["quit", "q"],
        description: "Quit plugify-cli"
    }
    public execute(): void {
        return process.exit(0);
    }
    constructor() {}
}