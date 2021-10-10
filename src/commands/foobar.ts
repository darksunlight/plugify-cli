import { Command } from "@/types";

export class FooBarCommand implements Command {
    public data = {
        name: "foobar",
        aliases: [],
        description: "Test command, prints FOOBAR"
    }
    public execute(): void {
        return console.log("FOOBAR");
    }
    constructor() {}
}