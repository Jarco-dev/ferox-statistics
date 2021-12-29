import type prisma from "@prisma/client";
import type { CommandInteraction, MessageComponentInteraction, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import moment from "moment";
import { GameStatistics } from "../../types";
import BaseCommand from "../../utils/structures/BaseCommand";

class GameStatsCommand extends BaseCommand {
    constructor() {
        super({
            name: "gamestats",
            description: "View game statistics from the ferox minecraft server",
            options: [
                {
                    type: "NUMBER",
                    name: "id",
                    description: "View a specific game by it's id"
                }, {
                    type: "STRING",
                    name: "username",
                    description: "View one of a users 25 latest games by username"
                }, {
                    type: "USER",
                    name: "user",
                    description: "View one of a users 25 latest games by user"
                }, {
                    type: "BOOLEAN",
                    name: "hidden",
                    description: "View the statistics in a hidden message"
                }
            ],
            cooldown: 3000,
            status: "DEV"
        });
    }

    public async run(i: CommandInteraction): Promise<void> {
        const id = i.options.getNumber("id");
        const user = i.options.getUser("user");
        const username = i.options.getString("username");
        const hidden = i.options.getBoolean("hidden");
        let data: prisma.GameStats | prisma.GameStats[];

        let inputCount = 0;
        if (id) inputCount++;
        if (user) inputCount++;
        if (username) inputCount++;

        // No more than 1 input
        if (inputCount > 1) {
            this.sender.reply(i, {
                content: "You can only provide one of id, username or user at a time",
                ephemeral: true
            }, { msgType: "INVALID" });
            return;
        }

        // Game by id
        else if (id) {
            const res = await this.prisma.gameStats.findUnique({ where: { id } });
            if (!res) {
                this.sender.reply(i, {
                    content: `A game with the id ${id} doesn't exist`,
                    ephemeral: true
                }, { msgType: "INVALID" });
                return;
            }
            data = res;
        }

        // 25 most recent by username or user
        else if (user || username) {
            let uuid: string;
            if (user) {
                const res = await this.prisma.stats.findUnique({ where: { discordid: user.id } });
                if (!res) {
                    this.sender.reply(i, {
                        content: `${user} doesn't have their discord linked`,
                        ephemeral: true
                    }, { msgType: "INVALID" });
                    return;
                }
                uuid = res.uuid;
            } else if (username) {
                const res = await this.mojang.getUuid(username);
                if (!res) {
                    this.sender.reply(i, {
                        content: `The username ${username} doesn't exist`,
                        ephemeral: true
                    }, { msgType: "INVALID" });
                    return;
                }
                uuid = res;
            } else {
                throw new Error("unexpected result from if statements");
            }

            // Fetch the data
            const res = await this.prisma.gameStats.findMany({
                where: {
                    OR: [
                        { teambluemembers: { contains: uuid } },
                        { teamredmembers: { contains: uuid } }
                    ]
                }
            });

            if (res.length === 0) {
                this.sender.reply(i, {
                    content: `${(username) ? username : `${user}`} didn't play any games yet`,
                    ephemeral: true
                }, { msgType: "INVALID" });
                return;
            }
            data = res;
        }

        // 25 most recent
        else {
            const res = await this.prisma.gameStats.findMany({
                take: 25,
                orderBy: [{ id: "desc" }]
            });
            if (!res) {
                this.sender.reply(i, {
                    content: "No games have been played yet",
                    ephemeral: true
                }, { msgType: "INVALID" });
                return;
            }
            data = res;
        }

        // Let the user pick a game if multiple
        if (Array.isArray(data)) {
            if (data.length === 1) data = data[1];
            else {
                // Turn around array if needed
                if (data[0].id < data[1].id) data.reverse();

                // Crate the component
                const options: MessageSelectOptionData[] = [];
                for (let i = 0; i < data.length; i++) {
                    options.push({
                        label: `Game #${data[i].id}`,
                        description: `View the statistics of game #${data[i].id}`,
                        value: i.toString()
                    });
                }

                const row1 = this.global.actionRow()
                    .addComponents(
                        this.global.selectMenu()
                            .setCustomId("gamestats_selectGame")
                            .setPlaceholder("Pick a game to view")
                            .setOptions(options)
                    );
                const reply = await this.sender.reply(i, {
                    content: "Please select a game",
                    components: [row1],
                    ephemeral: !!(hidden),
                    fetchReply: true
                }, { msgType: "TIME" });
                if (!reply) throw new Error("link gamestat select embed could not be sent");

                // Await and handle user input
                const filter = (i2: MessageComponentInteraction) => i2.user.id === i.user.id;
                const i2 = await reply.awaitMessageComponent({ filter, time: 60000 })
                    .catch(() => {}) as SelectMenuInteraction | undefined;

                if (!i2) {
                    reply.components.forEach((row) => row.components.forEach((comp) => comp.disabled = true));
                    this.sender.reply(i, {
                        content: "The selection timed out",
                        components: reply.components
                    }, { method: "EDIT_REPLY" });
                    return;
                } else if (i2.customId === "gamestats_selectGame") {
                    data = data[parseInt(i2.values[0])];
                }
            }
        }

        // Parse the data
        data = data as prisma.GameStats;
        const gameStats: GameStatistics = {
            ...data,
            killDeathRatio: (data.totaldeaths > 0 && data.totalkills > 0) ? (data.totaldeaths / data.totalkills).toFixed(2) : "0.00",
            bowAccuracy: (data.totalarrowsshot === 0) ? `100%` : `${Math.round((data.totalarrowsshot / data.totalarrowsshot) * 100)}%`,
            matchduration: this.global.parseTime(parseInt(data.matchduration.toString())),
            teamBlueNames: [],
            teamRedNames: [],
            createdat: moment.utc(data.createdat).format("YYYY-MM-DD HH:mm:ss")
        };

        for (const uuid of await JSON.parse(data.teambluemembers)) {
            const name = await this.mojang.getUsername(uuid);
            if (name) gameStats.teamBlueNames.push(name);
        }

        for (const uuid of JSON.parse(data.teamredmembers)) {
            const name = await this.mojang.getUsername(uuid);
            if (name) gameStats.teamRedNames.push(name);
        }

        // Create and send the embed
        const embed = this.global.embed()
            .setAuthor("FeroxCore", `https://api.mcsrvstat.us/icon/${this.sConfig.MISC.SERVER_IP}`)
            .setTitle(`Game #${gameStats.id}`)
            .addField("Misc", `\`>\` Winner: \`${gameStats.winner}\`\n\`>\` Map: \`${gameStats.gamemap}\`\n\`>\` Duration: \`${gameStats.matchduration}\`\n\`>\` Date: \`${gameStats.createdat}\``)
            .addField("Bow", `\`>\` Shots taken: \`${gameStats.totalarrowsshot}\`\n\`>\` Shots hit: \`${gameStats.totalarrowshit}\`\n\`>\` Accuracy: \`${gameStats.bowAccuracy}\``, true)
            .addField("Combat", `\`>\` Kills: \`${gameStats.totalkills}\`\n\`>\` Deaths: \`${gameStats.totaldeaths}\`\n\`>\` KDR: \`${gameStats.killDeathRatio}\``, true)
            .addField("Blocks", `\`>\` Placed: \`${gameStats.blocksplaced}\`\n\`>\` Broken: \`${gameStats.blocksbroken}\``, true)
            .addField(`Team red (${gameStats.teamRedNames.length})`, gameStats.teamRedNames.join(", ") || "No usernames found", true)
            .addField(`Team blue (${gameStats.teamBlueNames.length})`, gameStats.teamBlueNames.join(", ") || "No usernames found", true);

        this.sender.reply(i, {
            embeds: [embed],
            components: [],
            ephemeral: !!(hidden)
        }, { method: (i.replied) ? "EDIT_REPLY" : "REPLY" });

    }
}

export default GameStatsCommand;
