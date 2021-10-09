const Websocket = require("ws");
const fetch = require("node-fetch");
const fs = require("fs");
const readline = require("readline");
require("dotenv").config();
const token = process.env.TOKEN;
if (!token) {
    console.log("Please insert your token according to instructions first.");
    return process.exit(1);
}

// eslint-disable-next-line no-unused-vars
let loggedIn = false;
let isDead = false;
let user = {
    username: "",
    displayName: null,
    avatarUrl: "",
    email: "",
    flags: 0,
    proSince: null,
    proUntil: null
};
/** @type Map<string, {
    id: string;
    name: string;
    description: string;
    type: string;
    groupId: string;
    creaedAt: string;
    updatedAt: string;
}> */
let channels = new Map();
/** @type string */
let channel = null;
const users = new Map();

const commands = new Map();
for (const file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
    const command = require(`./commands/${file}`);
    commands.set(command.data.name, command);
    command.data.aliases.forEach(alias => {
        commands.set(alias, command);
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
    completer: completer
});

fixStdoutFor(rl);

function completer(line) {
    const completions = ".exit .quit .join .groups .group .invite .channels .channel .userinfo".split(" ");
    const hits = completions.filter((c) => c.startsWith(line));
    // Show all completions if none found
    return [hits.length ? hits : completions, line];
}

function fixStdoutFor(cli) {
    var oldStdout = process.stdout;
    var newStdout = Object.create(oldStdout);
    newStdout.write = function() {
        cli.output.write("\x1b[2K\r");
        var result = oldStdout.write.apply(
            this,
            Array.prototype.slice.call(arguments)
        );
        cli._refreshLine();
        return result;
    };
    process.__defineGetter__("stdout", function() { return newStdout; });
}

// eslint-disable-next-line no-unused-vars
async function apiGet(path) {
    return await (await fetch(`https://${process.env.API_DOMAIN ?? "api.plugify.cf"}/v2${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        }
    })).json();
}

// eslint-disable-next-line no-unused-vars
async function apiPost(path, body) {
    return await (await fetch(`https://${process.env.API_DOMAIN ?? "api.plugify.cf"}/v2${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(body)
    })).json();
}

const ws = new Websocket(`wss://${process.env.API_DOMAIN ?? "api.plugify.cf"}/`);

ws.onopen = () => {
    console.log("WS | Opened.");
    setInterval(() => { 
        if (isDead) {
            console.log("We lost connection with Plugify server. Quitting.");
            process.exit(1);
        }
        ws.send(JSON.stringify({ event: 9001 })); 
        isDead = true; 
    }, 10000);
};

ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    switch (data.event) {
        case 0: {
            ws.send(JSON.stringify({ event: 1, data: { token: token } }));
            break;
        }
        case 2: {
            loggedIn = true;
            user = data.data;
            if (process.env.JOIN_CHANNEL) ws.send(JSON.stringify({ event: 4, data: { id: process.env.JOIN_CHANNEL } }));
            break;
        }
        case 3: {
            console.log("Authentication error: %s", data.data);
            return process.exit(1);
        }
        case 5: {
            channel = data.data.channel.id;
            channels.set(channel, data.data.channel);
            rl.setPrompt(`${user.displayName ?? user.username}, #${channels.get(channel).name}> `);
            if (data.data.history) data.data.history.forEach(message => handleMessage(message));
            break;
        }
        case 9001: {
            isDead = false;
            break;
        }
        default: {
            console.log("WS >>", data);
            break;
        }
    }
};


function handleMessage(data) {
    const author = data.author;
    users.set(author.username, author);
    const time = new Date(data.timestamp);
    const timeString = `${time.getHours() < 10 ? "0" : ""}${time.getHours()}:${time.getMinutes() < 10 ? "0" : ""}${time.getMinutes()}`;
    let content = data.content;
    let output = "";
    if (content.match(new RegExp(`<@${user.username}>`))) {
        output = "\x1b[47m\x1b[30m";
        content = content.replace(/<@([a-z0-9_-]+)>/gi, "@$1");
    } else {
        content = content.replace(/<@([a-z0-9_-]+)>/gi, "\x1b[47m\x1b[30m@$1\x1b[0m");
    }
    output += `${timeString} [${author.displayName} (@${author.username})]: ${content}\x1b[0m`;
    console.log(output);
}
