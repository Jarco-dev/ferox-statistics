import BaseEvent from "../../utils/structures/BaseEvent";
import Client from "../../index";
import type { Interaction } from "discord.js";
import { Collection, TextChannel } from "discord.js";

class InteractionCreateEvent extends BaseEvent {
    private readonly commands: typeof Client.commandLoader.commands;
    private cooldownManager: typeof Client.cooldownManager;

    constructor() {
        super("interactionCreate");

        this.commands = this.client.commandLoader.commands;
        this.cooldownManager = this.client.cooldownManager;
    }

    public async run(i: Interaction): Promise<void> {
        // Commands
        if (i.isCommand()) {
            try {
                // Get the corresponding command
                const command = this.commands[i.commandName];
                if (!command) throw new Error(`The ${i?.commandName} command could not be found`);

                // Process command options
                if (i.channel instanceof TextChannel) {
                    const channelPerms = i.channel.permissionsFor(this.client.user!.id) ?? new Collection();

                    // bot permissions
                    for (let perm in command.botPermissions) {
                        if (!channelPerms.has(command.botPermissions[perm])) {
                            if (channelPerms.has("VIEW_CHANNEL") && channelPerms.has("SEND_MESSAGES") && channelPerms.has("EMBED_LINKS")) {
                                this.sender.reply(i, {
                                    content: `The bot doesn't have the \`${command.botPermissions[perm]}\` permission in ${i.channel}, Please contact a server admin!`
                                }, { msgType: "INVALID" });
                            }
                            return;
                        }
                    }

                    // nsfw
                    if (command.nsfw && i.channel.nsfw) {
                        if (!channelPerms.has("VIEW_CHANNEL") && channelPerms.has("SEND_MESSAGES") && channelPerms.has("EMBED_LINKS")) {
                            this.sender.reply(i, { content: "This command can only be used in **nsfw** channels!" }, {
                                delTime: 5000,
                                msgType: "INVALID"
                            });
                        }
                        return;
                    }
                } else {
                    // disableDm
                    if (command.disableDm) {
                        this.sender.reply(i, { content: "This command is disabled outside of servers!" }, {
                            delTime: 5000,
                            msgType: "INVALID"
                        });
                        return;
                    }
                }

                // Check user command cooldown
                if (command.cooldown > 0 && this.cooldownManager.check(i, command)) return;

                // Run the command
                try {
                    command.run(i);
                } catch (err) {
                    this.logger.error(`Error while executing a command commandName: ${command.name}${(i.inGuild()) ? ` guildId: ${i.guild!.id}` : ""}`, err);
                    this.sender.reply(i, { content: "Something went wrong while running the command, the command might have not worked fully!" }, { msgType: "ERROR" });
                }
            } catch (err) {
                this.logger.error(`Error while going through command handler`, err);
                this.sender.reply(i, { content: "Something went wrong, please try again" }, { msgType: "ERROR" });
            }
        }
    }
}

export default InteractionCreateEvent;
