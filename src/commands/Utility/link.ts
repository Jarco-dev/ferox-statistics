import type { CommandInteraction, MessageComponentInteraction } from "discord.js";
import moment from "moment";
import BaseCommand from "../../utils/structures/BaseCommand";

class LinkCommand extends BaseCommand {
    constructor() {
        super({
            name: "link",
            description: "Link your discord with the minecraft server",
            options: [
                {
                    type: "SUB_COMMAND",
                    name: "info",
                    description: "View a example on how to link your account"
                }, {
                    type: "SUB_COMMAND",
                    name: "confirm",
                    description: "Link your discord account with your minecraft account",
                    options: [{
                        type: "STRING",
                        name: "token",
                        description: "The server provided token for linking accounts",
                        required: true
                    }]
                }, {
                    type: "SUB_COMMAND",
                    name: "status",
                    description: "View the status of your account"
                }, {
                    type: "SUB_COMMAND",
                    name: "reset",
                    description: "Reset your account thus removing the link"
                }
            ],
            cooldown: 3000,
            status: "ENABLED"
        });
    }

    public run(i: CommandInteraction): void {
        switch (i.options.getSubcommand()) {
            case "info": {
                this._runInfoSubCommand(i);
                break;
            }

            case "confirm": {
                this._runConfirmSubCommand(i);
                break;
            }

            case "status": {
                this._runStatusSubCommand(i);
                break;
            }

            case "reset": {
                this._runResetSubCommand(i);
                break;
            }
        }
    }

    private _runInfoSubCommand(i: CommandInteraction): void {
        // Create and sent the info message
        const embed = this.global.embed()
            .setTitle("Account linking")
            .setDescription(`
                **1.** Login to the minecraft server \`${this.sConfig.MISC.SERVER_IP}\`
                **2.** Run the \`/verify\` command in game to get a token
                **3.** Go into any server with the \`${this.client.user!.username}\` bot
                **4.** Run the command bot command \`/link confirm\` providing the received token
                **5.** You're all set and ready to go! 
            `);

        this.sender.reply(i, { embeds: [embed] });
    }

    private async _runConfirmSubCommand(i: CommandInteraction): Promise<void> {
        // Check link status
        const linkedData = await this.prisma.stats.findUnique({ where: { discordid: i.user.id } });
        if (linkedData) {
            this.sender.reply(i, { content: "You are already linked, see `/link status` for more and `/link reset` to reset" }, { msgType: "INVALID" });
            return;
        }

        const token = i.options.getString("token", true);
        const data = await this.prisma.registrationCodes.findUnique({ where: { code: token } });

        // Validate token
        if (!data) {
            this.sender.reply(i, {
                content: "The token provided is invalid, please closely follow `/link info`",
                ephemeral: true
            }, { msgType: "INVALID" });
            return;
        }

        // Check expiry date
        const now = moment.utc((await this.prisma.$queryRaw<[{ "NOW()": string }]>`SELECT NOW();`)[0]["NOW()"]);
        const expireAt = moment.utc(data.createdat).add(10, "minutes");
        if (expireAt.isBefore(now)) {
            await this.prisma.registrationCodes.delete({ where: { code: token } });
            this.sender.reply(i, {
                content: "This is a expired code, please obtain a new one",
                ephemeral: true
            }, { msgType: "INVALID" });
            return;
        }

        // Link user
        await this.prisma.registrationCodes.delete({ where: { code: token } });
        await this.prisma.stats.update({ data: { discordid: i.user.id }, where: { uuid: data.uuid } });
        const username = await this.mojang.getUsername(data.uuid);
        this.sender.reply(i, { content: `Your account is now linked to \`${username}\`` }, { msgType: "SUCCESS" });
    }

    private async _runStatusSubCommand(i: CommandInteraction): Promise<void> {
        const data = await this.prisma.stats.findUnique({ where: { discordid: i.user.id } });

        // check and send status
        if (!data) {
            this.sender.reply(i, {
                content: "Your account is currently not linked, for info about linking use `/link info`",
                ephemeral: true
            }, { msgType: "INVALID" });
        } else {
            const username = await this.mojang.getUsername(data.uuid);
            this.sender.reply(i, { content: `Your account is currently linked to \`${username}\`` }, { msgType: "SUCCESS" });
        }
    }

    private async _runResetSubCommand(i: CommandInteraction): Promise<void> {
        // Check for current link
        const data = await this.prisma.stats.findUnique({ where: { discordid: i.user.id } });
        if (!data) {
            this.sender.reply(i, {
                content: "Your account is currently not linked, for info about linking use /link info",
                ephemeral: true
            }, { msgType: "INVALID" });
            return;
        }

        // Create embed and buttons
        const username = await this.mojang.getUsername(data.uuid);
        const embed = this.global.emptyEmbed()
            .setColor(this.config.COLORS.DEFAULT)
            .setTitle("Confrimation")
            .setDescription(`Are you sure you want to remove the link with the account \`${username}\`?`);
        const buttons = this.global.actionRow()
            .addComponents(
                this.global.button()
                    .setLabel("Confirm")
                    .setStyle("SUCCESS")
                    .setCustomId("link_reset_confirm")
                ,
                this.global.button()
                    .setLabel("Cancel")
                    .setStyle("DANGER")
                    .setCustomId("link_reset_cancel")
            );

        // Send confirm msg
        const reply = await this.sender.reply(i, { embeds: [embed], components: [buttons], fetchReply: true });
        if (!reply) throw new Error("link reset confirm embed could not be sent");

        // Await and handle user input
        const filter = (i2: MessageComponentInteraction) => i2.user.id === i.user.id;
        const i2 = await reply.awaitMessageComponent({ filter, time: 15000 }).catch(() => {});

        if (!i2) {
            reply.components.forEach((row) => row.components.forEach((comp) => comp.disabled = true));
            this.sender.reply(i, {
                content: "The confirmation timed out",
                components: reply.components
            }, { method: "EDIT_REPLY" });
        } else if (i2.customId === "link_reset_cancel") {
            reply.components.forEach((row) => row.components.forEach((comp) => comp.disabled = true));
            this.sender.reply(i2, {
                content: "The confrimation has been cancled",
                components: reply.components
            }, { msgType: "SUCCESS", method: "UPDATE" });
        } else if (i2.customId === "link_reset_confirm") {
            reply.components.forEach((row) => row.components.forEach((comp) => comp.disabled = true));
            await this.prisma.stats.update({ data: { discordid: null }, where: { uuid: data.uuid } });
            this.sender.reply(i2, {
                content: "The accounts have been unlinked",
                components: reply.components
            }, { msgType: "SUCCESS", method: "UPDATE" });
        }
    }
}

export default LinkCommand;
