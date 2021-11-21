import { Client } from "@/client";
import { GatewayHandler } from "@/gateway";

import { Command } from "@/types";
import { ChannelCommand } from "@commands/channel";
import { ChannelsCommand } from "@commands/channels";
import { EvalCommand } from "@commands/eval";
import { ExitCommand } from "@commands/exit";
import { FocusCommand } from "@commands/focus";
import { GroupCommand } from "@commands/group";
import { GroupsCommand } from "@commands/groups";
import { HelpCommand } from "@commands/help";
import { InviteCommand } from "@commands/invite";
import { JoinCommand } from "@commands/join";
import { RestCommand } from "@commands/rest";
// import { RolesCommand } from "@commands/roles";
import { RoleCommand } from "@commands/role";
// import { FooBarCommand } from "@commands/foobar";

export class CommandHandler {
    public readonly commands: Map<string, Command>;
    public readonly commandsWithoutAliases: Map<string, Command>;
    public gateway: GatewayHandler;
    constructor(public client: Client) {
        this.gateway = client.gateway;
        this.commands = new Map();
        this.commandsWithoutAliases = new Map();
        [ChannelCommand, ChannelsCommand, EvalCommand, ExitCommand, FocusCommand, GroupCommand, GroupsCommand, HelpCommand, InviteCommand, JoinCommand, RestCommand, RoleCommand].forEach(commandClass => {
            const command = new commandClass();
            this.commands.set(command.data.name, command);
            this.commandsWithoutAliases.set(command.data.name, command);
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