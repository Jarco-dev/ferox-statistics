import type { CommandInteraction } from "discord.js";
import type { GameStatisticType, UserStatisticType } from "../../types";
import BaseCommand from "../../utils/structures/BaseCommand";

class LeaderboardCommand extends BaseCommand {
    public valueToName: { [key: string]: string };

    constructor() {
        super({
            name: "leaderboard",
            description: "View the leaderboards",
            options: [
                {
                    type: "SUB_COMMAND",
                    name: "users",
                    description: "User leaderboards",
                    options: [
                        {
                            type: "STRING",
                            name: "statistic",
                            description: "The statistic you want to view",
                            choices: [
                                { name: "Kills", value: "kills" },
                                { name: "Deaths", value: "deaths" },
                                { name: "Wins", value: "wins" },
                                { name: "Loses", value: "loses" },
                                { name: "Nexuses broken", value: "nexusesbroken" },
                                { name: "Arrows shot", value: "arrowsshot" },
                                { name: "Arrows hit", value: "arrowshit" },
                                { name: "Playtime", value: "playtime" }
                            ],
                            required: true
                        }, {
                            type: "BOOLEAN",
                            name: "hidden",
                            description: "View the statistics in a hidden message"
                        }
                    ]
                }, {
                    type: "SUB_COMMAND",
                    name: "games",
                    description: "Game leaderboards",
                    options: [
                        {
                            type: "STRING",
                            name: "statistic",
                            description: "The statistic you want to view",
                            choices: [
                                { name: "Total kills", value: "totalkills" },
                                { name: "Total deaths", value: "totaldeaths" },
                                { name: "Total arrows shot", value: "totalarrowsshot" },
                                { name: "Total arrows hit", value: "totalarrowshit" },
                                { name: "Blocks placed", value: "blocksplaced" },
                                { name: "Blocks broken", value: "blocksbroken" },
                                { name: "Match duration", value: "matchduration" }
                            ],
                            required: true
                        }, {
                            type: "BOOLEAN",
                            name: "hidden",
                            description: "View the statistics in a hidden message"
                        }
                    ]
                }
            ],
            cooldown: 3000,
            status: "ENABLED"
        });

        this.valueToName = {
            kills: "Kills",
            deaths: "Deaths",
            wins: "Wins",
            loses: "Loses",
            nexusesbroken: "Nexuses broken",
            arrowsshot: "Arrows shot",
            arrowshit: "Arrows hit",
            playtime: "Playtime",
            totalkills: "Total kills",
            totaldeaths: "Total deaths",
            totalarrowsshot: "Total arrows shot",
            totalarrowshit: "Total arrows hit",
            blocksplaced: "Blocks placed",
            blocksbroken: "Blocks broken",
            matchduration: "Match duration"
        };
    }

    public async run(i: CommandInteraction): Promise<void> {
        switch (i.options.getSubcommand(true)) {

            case "users": {
                this._runUsersSubCommand(i);
                break;
            }

            case "games": {
                this._runGamesSubCommand(i);
                break;
            }

        }
    }

    private async _runUsersSubCommand(i: CommandInteraction): Promise<void> {
        // Get the top 10
        const statistic = i.options.getString("statistic", true) as UserStatisticType;
        const hidden = i.options.getBoolean("hidden");
        const data = await this.prisma.stats.findMany({
            take: 10,
            orderBy: [{ [statistic]: "desc" }, { updatedat: "asc" }]
        });

        // Create and send the embed
        let desc = "";
        for (let i = 0; i < data.length; i++) {
            const username = await this.mojang.getUsername(data[i].uuid);
            let stat = (statistic === "playtime") ? this.global.parseTime(data[i][statistic] ?? 0) : data[i][statistic];
            desc += `**${i + 1}.** ${stat} - ${username}\n`;
        }

        const embed = this.global.embed()
            .setTitle(`${this.valueToName[statistic]} leaderboard`)
            .setDescription(desc);
        this.sender.reply(i, { embeds: [embed], ephemeral: !!(hidden) });
    }

    private async _runGamesSubCommand(i: CommandInteraction): Promise<void> {
        // Get the top 10
        const statistic = i.options.getString("statistic", true) as GameStatisticType;
        const hidden = i.options.getBoolean("hidden");
        const data = await this.prisma.gameStats.findMany({
            take: 10,
            orderBy: [{ [statistic]: "desc" }, { createdat: "asc" }]
        });

        // Create and send the embed
        let desc = "";
        for (let i = 0; i < data.length; i++) {
            let stat = (statistic === "matchduration") ? this.global.parseTime(data[i][statistic] ?? 0) : data[i][statistic];
            desc += `**${i + 1}.** ${stat} - #${data[i].id}\n`;
        }

        const embed = this.global.embed()
            .setTitle(`${this.valueToName[statistic]} leaderboard`)
            .setDescription(desc);
        this.sender.reply(i, { embeds: [embed], ephemeral: !!(hidden) });
    }
}

export default LeaderboardCommand;
