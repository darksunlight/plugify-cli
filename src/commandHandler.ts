import { Client } from "@/client";
import { GatewayHandler } from "@/gateway";

import { Command } from "@/types";
import { ChannelsCommand } from "@commands/channels";
import { ExitCommand } from "@commands/exit";
import { FocusCommand } from "@commands/focus";
import { GroupsCommand } from "@commands/groups";
import { InviteCommand } from "@commands/invite";
import { JoinCommand } from "@commands/join";
import { RestCommand } from "@commands/rest";
// import { FooBarCommand } from "@commands/foobar";

export class CommandHandler {
    public readonly commands: Map<string, Command>;
    public gateway: GatewayHandler;
    constructor(public client: Client) {
        this.gateway = client.gateway;
        this.commands = new Map();
        [ChannelsCommand, ExitCommand, FocusCommand, GroupsCommand, InviteCommand, JoinCommand, RestCommand].forEach(commandClass => {
            const command = new commandClass();
            this.commands.set(command.data.name, command);
            command.data.aliases.forEach(alias => {
                this.commands.set(alias, command);
            });
        });
    }

    public isCommand(key: string): boolean {
        return [...this.commands.keys()].includes(key);
    }

    public async execute(command: string, line: string[]): Promise<void> {
        await this.commands.get(command)?.execute({ line, client: this.client });
    }
}