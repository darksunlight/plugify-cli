import { Command } from "@/types";

export class ExitCommand implements Command {
    public data = {
        name: "exit",
        aliases: ["quit", "q"]
    }
    public execute(): void {
        return process.exit(0);
    }
    constructor() {}
}