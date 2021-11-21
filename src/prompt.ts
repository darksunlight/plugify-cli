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
        if (line.startsWith(this.client.commandPrefix)) {
            const command = line.substring(this.client.commandPrefix.length);
            if (command.startsWith("focus ")) return this.groupCompleter(`${this.client.commandPrefix}focus `, line);
            if (command.startsWith("channels ")) return this.groupCompleter(`${this.client.commandPrefix}channels `, line);
            if (command.startsWith("group info ")) return this.groupCompleter(`${this.client.commandPrefix}group info `, line);
            if (command.startsWith("group invites ")) return this.groupCompleter(`${this.client.commandPrefix}group invites `, line);
            if (command.startsWith("group bans ")) return this.groupCompleter(`${this.client.commandPrefix}group bans `, line);
            if (command.startsWith("invite create ")) return this.groupCompleter(`${this.client.commandPrefix}invite create `, line);
            if (command.startsWith("join ")) return this.channelCompleter(`${this.client.commandPrefix}join `, line);
            if (command.startsWith("channel info ")) return this.channelCompleter(`${this.client.commandPrefix}channel info `, line);
            if (command.startsWith("channel edit ")) return this.channelCompleter(`${this.client.commandPrefix}channel edit `, line);
            if (command.startsWith("channel delete ")) return this.channelCompleter(`${this.client.commandPrefix}channel delete `, line);
            if (command.startsWith("roles ") && this.client.focusedGroup && this.client.groups.get(this.client.focusedGroup) && this.client.groups.get(this.client.focusedGroup)!.roles) {
                if (command.startsWith("roles info ")) return this.roleCompleter(`${this.client.commandPrefix}roles info `, line, true);
                if (command.startsWith("roles assign ")) return this.roleCompleter(`${this.client.commandPrefix}roles assign `, line, false);
                if (command.startsWith("roles edit ")) {
                    if (command.substring(11).match(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12} $/)) return this.rolesEditCompleter(line);
                    else return this.roleCompleter(`${this.client.commandPrefix}roles edit `, line, false);
                }
            }
        }
        const checkCommand = this.client.commandHandler.commands.get(line.split(" ")[0].substring(this.client.commandPrefix.length));
        if (checkCommand && checkCommand.data.expectArg) return this.expectArgCompleter(line.split(" ")[0], line);
        const completions = [...this.client.commandHandler.commands.keys()].map(x => `${this.client.commandPrefix}${x}`);
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
        return this.fullChannelCompleter(command, line);
    }

    private fullChannelCompleter(command: string, line: string) {
        const completions = [...this.client.channels.keys()].map(x => `${command}${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    private roleCompleter(command: string, line: string, defaultRole: boolean) {
        const roles = [...this.client.groups.get(this.client.focusedGroup)!.roles!.keys()];
        const completions = (defaultRole ? [...roles, "default"] : roles).map(x => `${command}${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    private expectArgCompleter(command: string, line: string) {
        const completions = this.client.commandHandler.commands.get(command.substring(this.client.commandPrefix.length))!.data.expectArg!.split(" ").map(x => `${command} ${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    private rolesEditCompleter(line: string) {
        const keys = ["name:", "permissions:"];
        const completions = keys.map(x => `${line}${x}`);
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }

    public startListener(): void {
        this.rl.on("line", async (input) => {
            const line = input.split(" ");
            if (line[0].startsWith(this.client.commandPrefix) && this.client.commandHandler.isCommand(line[0].substring(this.client.commandPrefix.length))) {
                await this.client.commandHandler.execute(line[0].substring(this.client.commandPrefix.length), line);
                return this.prompt();
            }
            if (!this.client.joinedChannel) {
                console.log(`You should join a channel. Use \`${this.client.commandPrefix}join <channel ID>\` for that.`);
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
