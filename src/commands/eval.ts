import { Command, CommandExecuteArguments } from "@/types";

export class EvalCommand implements Command {
    public data = {
        name: "eval",
        aliases: [],
        description: "DO NOT USE THIS IF YOU DO NOT KNOW WHAT YOU ARE DOING. Evaluate the given script."
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public execute({ line, client }: CommandExecuteArguments): void {
        try {
            const result = eval(line.slice(1).join(" "));
            console.log("Result returned:");
            return console.log(result);
        } catch (e) {
            console.log("Error:");
            return console.log(e);
        }
    }
    constructor() {}
}