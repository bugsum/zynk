import { env, logger, traverse } from "../lib/utils";
import { fetchCommands } from "../lib/utils/fetch";
import { APIUser, REST, Routes } from "discord.js";
import path from "node:path";

async function deploy() {
    const rest = new REST().setToken(env("CLIENT_TOKEN"));
    const content = await fetchCommands(path.join(__dirname, "../commands"));
    const user = (await rest.get(Routes.user())) as APIUser;
    const endpoint =
        env("NODE_ENV", "production") === "production"
            ? Routes.applicationCommands(env("CLIENT_ID"))
            : Routes.applicationGuildCommands(
                  env("CLIENT_ID"),
                  env("DISCORD_GUILD_ID"),
              );

    content.forEach(async (command) => {
        await rest.put(endpoint, {
            body: content.map((c) => c.data.toJSON()),
        });
    });

    return user;
}

deploy()
    .then((user) => {
        const tag = `${user.username}`;
        const response =
            env("NODE_ENV", "production") === "production"
                ? `Successfully registered commands in production as ${user.username}`
                : `Successfully registered commands for development as ${user.username}`;

        logger.info(response);
    })
    .catch(console.error);
