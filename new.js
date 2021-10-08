const Websocket = require("ws");
const fetch = require("node-fetch").default;
const fs = require("fs");
const readline = require("readline");
require("dotenv").config();
const token = process.env.token;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "???", 
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