import { GatewayHandler } from "@/gateway";
import { CommandHandler } from "@/commandHandler";
import { RestManager } from "@/rest";
import { Prompt } from "@/prompt";
import { Channel, Group, User } from "@/types";

export class Client {
    public isDead = false;
    public loggedIn = false;
    public token: string;
    public commandPrefix = process.env.COMMAND_PREFIX ?? ".";

    public gateway: GatewayHandler;
    public commandHandler: CommandHandler;
    public rest: RestManager;
    public prompt: Prompt;

    public channels: Map<string, Channel>;
    public groups: Map<string, Group>;
    public users: Map<string, User>;

    public joinedChannel: string;
    public focusedGroup: string;
    public user: User;
    public apiDomain = process.env.API_DOMAIN ?? "api.plugify.cf";

    constructor() {
        this.channels = new Map();
        this.groups = new Map();
        this.users = new Map();
        this.gateway = new GatewayHandler(this);
        this.commandHandler = new CommandHandler(this);
        this.rest = new RestManager(this);
        this.prompt = new Prompt(this);
    }

    async login(token: string): Promise<void> {
        this.token = token;
        return await this.gateway.init();
    }
}