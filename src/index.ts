import Client from "./Client";
import dotenv from "dotenv";

const client = new Client();
dotenv.config();

// Fix console being ugly on pterodactyl
console.log("\n");

// Authorise the bot
client.logger.info("Connecting to discord...");
client.login(process.env.TOKEN);

export default client;

// Catch any uncaught errors
process.on("uncaughtException", (err) => {
    client.logger.error("Uncaught exception in process#uncaughtException", err);
});

process.on("unhandledRejection", (err) => {
    client.logger.error("Unhandled rejection in process#unhandledRejection", err);
});
