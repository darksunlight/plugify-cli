import * as readline from "readline";
import { Client } from "@/client";
import { GatewayEvent } from "@/types";

export class Prompt {
    public rl: readline.Interface;
    public client: Client;

    constructor(client: Client) {
        this.client = client;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "", 
            completer: this.completer.bind(this)
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((cli: any) => {
            const oldStdout = process.stdout;
            const newStdout = Object.create(oldStdout);
            // eslint-disable-next-line no-unused-vars
            newStdout.write = function(...args: [str: string | Uint8Array, encoding?: BufferEncoding | undefined, cb?: ((err?: Error | undefined) => void) | undefined]) {
                cli.output.write("\x1b[2K\r");
                const result = oldStdout.write.apply(
                    this,
                    args
                );
                cli._refreshLine();
                return result;
            };
            Object.defineProperty(process, "stdout", {
                get: function() {
                    return newStdout;
                }
            });
        })(this.rl);
    }

    private completer(line: string) {
        if (line.startsWith(".focus ")) return this.groupCompleter(".focus ", line);
        if (line.startsWith(".channels ")) return this.groupCompleter(".channels ", line);
        if (line.startsWith(".group info ")) return this.groupCompleter(".group info ", line);
        if (line.startsWith(".invite create ")) return this.groupCompleter(".invite create ", line);
        if (line.startsWith(".join ")) return this.channelCompleter(".join ", line);
        const checkCommand = this.client.commandHandler.commands.get(line.split(" ")[0].substring(1));
        if (checkCommand && checkCommand.data.expectArg) return this.expectArgCompleter(line.split(" ")[0], line);
        const completions = [...this.client.commandHandler.commands.keys()].map(x => `.${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    private groupCompleter(command: string, line: string) {
        const completions = [...this.client.groups.keys()].map(x => `${command}${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    private channelCompleter(command: string, line: string) {
        if (this.client.focusedGroup && this.client.groups.get(this.client.focusedGroup)!.channels) {
            const completions = [...[...this.client.groups.get(this.client.focusedGroup)!.channels!.keys()].map(x => `${command}${x}`), ...[...this.client.groups.get(this.client.focusedGroup)!.channels!.values()].map(x => `${command}${x.name}`)];
            const hits = completions.filter((c) => c.startsWith(line));
            return [hits.length ? hits : completions, line];
        }
        const completions = [...this.client.channels.keys()].map(x => `${command}${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    private expectArgCompleter(command: string, line: string) {
        const completions = this.client.commandHandler.commands.get(command.substring(1))!.data.expectArg!.split(" ").map(x => `${command} ${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    public startListener(): void {
        this.rl.on("line", async (input) => {
            const line = input.split(" ");
            if (line[0].startsWith(".") && this.client.commandHandler.isCommand(line[0].substring(1))) {
                await this.client.commandHandler.execute(line[0].substring(1), line);
                return this.prompt();
            }
            if (!this.client.joinedChannel) {
                console.log("You should join a channel. Use `.join <channel ID>` for that.");
                return this.prompt();
            }
            if (this.client.gateway.ws.readyState == 1 && this.client.loggedIn) {
                this.client.gateway.send(GatewayEvent.MESSAGE_SEND, { content: input });
                return this.prompt();
            }
        });
    }

    public setPrompt(prompt: string): void {
        return this.rl.setPrompt(prompt);
    }

    public prompt(preserveCursor?: boolean | undefined): void {
        return this.rl.prompt(preserveCursor);
    }

    public expectArg(args: string): string {
        return `The first argument to this command must be one of the following: ${args.split(" ").join(", ")}`;
    }
}
