import BaseCommand from "../../utils/structures/BaseCommand";
import type { CommandInteraction, Message } from "discord.js";

class PingCommand extends BaseCommand {
    public rttEmoji: string;
    public hbEmoji: string;

    constructor() {
        super({
            name: "ping",
            description: "View the bots response time",
            options: [{
                type: "STRING",
                name: "action",
                description: "Extra actions for the ping command",
                choices: [{
                    name: "Explain",
                    value: "explain"
                }]
            }],
            cooldown: 3000,
            status: "ENABLED"
        });

        this.rttEmoji = "🔁";
        this.hbEmoji = "💟";
    }

    public async run(i: CommandInteraction) {
        // Ping action
        switch (i?.options?.getString("action", false)) {

            // Explain
            case "explain": {
                const explainEmbed = this.global.embed()
                    .setTitle("Ping explanation")
                    .setDescription(`
                        ${this.rttEmoji} **RTT**: The delay between you sending the message and the bot replying
                        ${this.hbEmoji} **Heartbeat**: The delay between the bot and the discord api servers
                    `);
                this.sender.reply(i, { embeds: [explainEmbed], ephemeral: true });
                break;
            }

            // Ping (default)
            default: {
                // Send a pinging message
                const pingingEmbed = this.global.embed()
                    .setTitle("Pinging...");
                const reply = await this.sender.reply(i, {
                    embeds: [pingingEmbed],
                    ephemeral: true,
                    fetchReply: true
                }, {}) as Message;

                // Calculate the delay and edit the reply
                const timeDiff = reply.createdTimestamp - i.createdTimestamp;
                const resultEmbed = this.global.embed()
                    .setTitle("Ping result")
                    .setDescription(`
                        ${this.rttEmoji} **RTT**: ${timeDiff}ms
                        ${this.hbEmoji} **Heartbeat**: ${this.client.ws.ping}ms
                    `);
                this.sender.reply(i, { embeds: [resultEmbed] }, { method: "EDIT_REPLY" });
            }
        }
    }
}

export default PingCommand;
