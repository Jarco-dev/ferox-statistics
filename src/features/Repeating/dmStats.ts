import type prisma from "@prisma/client";
import { Snowflake } from "discord.js";
import moment from "moment";
import type Client from "../../index";
import type { GameStatistics } from "../../types";
import BaseFeature from "../../utils/structures/BaseFeature";

class DmStats extends BaseFeature {
    public gameCount: number;

    constructor(client: typeof Client) {
        super("dmStats");

        this.gameCount = 0;
    }

    public async start(): Promise<void> {
        this.gameCount = await this.prisma.gameStats.count();
        setInterval(() => this._run(), 15000);
    }

    private async _run(): Promise<void> {
        // Check for a new game
        const newGameCount = await this.prisma.gameStats.count();
        if (newGameCount <= this.gameCount) return;
        this.gameCount = newGameCount;

        // Fetch and parse the game data
        let data: prisma.GameStats | prisma.GameStats[] = await this.prisma.gameStats.findMany({
            take: 1,
            orderBy: [{ createdat: "desc" }]
        });
        if (!data[0]) return;
        data = data[0];

        const userIds: Snowflake[] = [];
        const gameStats: GameStatistics = {
            ...data,
            killDeathRatio: (data.totaldeaths > 0 && data.totalkills > 0) ? (data.totalkills / data.totaldeaths).toFixed(2) : "0.00",
            bowAccuracy: (data.totalarrowsshot === 0) ? `100%` : `${Math.round((data.totalarrowsshot / data.totalarrowsshot) * 100)}%`,
            matchduration: this.global.parseTime(parseInt(data.matchduration.toString())),
            teamBlueNames: [],
            teamRedNames: [],
            createdat: moment.utc(data.createdat).format("YYYY-MM-DD HH:mm:ss")
        };

        for (const uuid of await JSON.parse(data.teambluemembers)) {
            // Get username
            const name = await this.mojang.getUsername(uuid);
            if (name) gameStats.teamBlueNames.push(name);

            // Get discord id
            const { discordid } = await this.prisma.stats.findUnique({
                where: { uuid },
                select: { discordid: true }
            }) as { discordid: string | null };
            if (discordid) userIds.push(discordid);
        }

        for (const uuid of JSON.parse(data.teamredmembers)) {
            // Get username
            const name = await this.mojang.getUsername(uuid);
            if (name) gameStats.teamRedNames.push(name);

            // Get discord id
            const { discordid } = await this.prisma.stats.findUnique({
                where: { uuid },
                select: { discordid: true }
            }) as { discordid: string | null };
            if (discordid) userIds.push(discordid);
        }

        // Create and send the embed
        const embed = this.global.embed()
            .setAuthor("FeroxCore", `https://api.mcsrvstat.us/icon/${this.sConfig.MISC.SERVER_IP}`)
            .setTitle(`Game #${gameStats.id}`)
            .addField("Misc", `
                \`>\` Winner: \`${gameStats.winner}\`
                \`>\` Map: \`${gameStats.gamemap}\`
                \`>\` Duration: \`${gameStats.matchduration}\`
                \`>\` Date: \`${gameStats.createdat}\`
            `)
            .addField("Bow", `
                \`>\` Shots taken: \`${gameStats.totalarrowsshot}\`
                \`>\` Shots hit: \`${gameStats.totalarrowshit}\`
                \`>\` Accuracy: \`${gameStats.bowAccuracy}\`
            `, true)
            .addField("Combat", `
                \`>\` Kills: \`${gameStats.totalkills}\`
                \`>\` Deaths: \`${gameStats.totaldeaths}\`
                \`>\` KDR: \`${gameStats.killDeathRatio}\`
            `, true)
            .addField("Blocks", `
                \`>\` Placed: \`${gameStats.blocksplaced}\`
                \`>\` Broken: \`${gameStats.blocksbroken}\`
            `, true)
            .addField(`Team red (${gameStats.teamRedNames.length})`, gameStats.teamRedNames.join(", ") || "No usernames found", true)
            .addField(`Team blue (${gameStats.teamBlueNames.length})`, gameStats.teamBlueNames.join(", ") || "No usernames found", true);

        for (const id of userIds) {
            const userSettings = await this.prisma.userSettings.findUnique({ where: { id } });
            if (userSettings && userSettings.dmStats) this.sender.msgUser(id, { embeds: [embed] }).catch(() => {});
        }
    }
}

export default DmStats;
