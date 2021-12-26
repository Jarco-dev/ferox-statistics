import { Intents } from "discord.js";
import type { Config } from "./types";

const config: Config = {

    // Bot colors
    COLORS: {
        DEFAULT: "#F88038"
    },

    // Message type emojis and colors
    MSG_TYPES: {
        SUCCESS: { EMOJI: "✅", COLOR: "#00FF00" },
        INVALID: { EMOJI: "❌", COLOR: "#F88038" },
        ERROR: { EMOJI: "⚠", COLOR: "#FF0000" },
        TIME: { EMOJI: "⏱", COLOR: "#F88038" }
    },

    CLIENT_OPTIONS: {
        intents: [
            // Intents.FLAGS.DIRECT_MESSAGES,
            // Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
            // Intents.FLAGS.DIRECT_MESSAGE_TYPING,
            Intents.FLAGS.GUILDS,
            // Intents.FLAGS.GUILD_BANS,
            // Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            // Intents.FLAGS.GUILD_INTEGRATIONS,
            // Intents.FLAGS.GUILD_INVITES,
            // Intents.FLAGS.GUILD_MEMBERS,
            // Intents.FLAGS.GUILD_MESSAGES,
            // Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            // Intents.FLAGS.GUILD_MESSAGE_TYPING,
            // Intents.FLAGS.GUILD_PRESENCES,
            // Intents.FLAGS.GUILD_VOICE_STATES,
            // Intents.FLAGS.GUILD_WEBHOOKS
        ]
    },

    VERSION: require("../package.json").version
};

export default config;
