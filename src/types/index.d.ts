import type { ClientOptions, HexColorString, Snowflake } from "discord.js";
import type { GameStats, Stats } from "@prisma/client";

export interface SecretConfig {
    LOG_LEVEL: LogLevel;
    CMD_LOAD_LEVEL: CommandStatus;
    CMD_DEV_GUILD: Snowflake;
    LINKS: {
        BOT_INVITE: string;
    };
    MISC: {
        METRICS_PORT: number;
        SERVER_IP: string;
    };
}

export interface Config {
    COLORS: {
        DEFAULT: HexColorString;
    },
    MSG_TYPES: {
        SUCCESS: { EMOJI: string; COLOR: HexColorString };
        INVALID: { EMOJI: string; COLOR: HexColorString };
        ERROR: { EMOJI: string; COLOR: HexColorString };
        TIME: { EMOJI: string; COLOR: HexColorString };
    },
    CLIENT_OPTIONS: ClientOptions;
    VERSION: string;
}

export interface SenderMessageOptions {
    delTime?: number;
    msgType?: SenderMessageType;
}

export interface SenderReplyOptions extends SenderMessageOptions {
    method?: SenderReplyMethod;
}

// Extend existing types keys/values while overwriting some
export type Modify<T, R> = Omit<T, keyof R> & R;

export type UserStatistics = Modify<Stats, {
    username: string;
    killDeathRatio: string;
    winLossRatio: string;
    bowAccuracy: string;
    playtime: string;
    createdat: string;
    gamesPlayed: number;
}>

export type GameStatistics = Modify<GameStats, {
    killDeathRatio: string;
    bowAccuracy: string;
    matchduration: string;
    teamBlueNames: string[];
    teamRedNames: string[];
    createdat: string;
}>

export type SenderMessageType =
    | "SUCCESS"
    | "INVALID"
    | "ERROR"
    | "TIME";

export type SenderReplyMethod =
    | "REPLY"
    | "EDIT_REPLY"
    | "UPDATE";

export type CommandStatus =
    | "ENABLED"
    | "DISABLED"
    | "DEV"
    | "ALL";

export type LogLevel =
    | "VERBOSE"
    | "DEBUG"
    | "INFO"
    | "WARN"
    | "ERROR";

export type StatisticType =
    | "wins"
    | "loses"
    | "kills"
    | "deaths"
    | "arrowsshot"
    | "arrowshit"
    | "playtime"
    | "nexusesbroken"
