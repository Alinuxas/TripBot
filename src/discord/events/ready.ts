import {
  Client,
  Collection,
  Guild,
  Invite,
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import { setTimeout } from 'timers/promises';
import { ReadyEvent } from '../@types/eventDef';
import { checkGuildPermissions } from '../utils/checkPermissions';
import { runTimer } from '../../global/utils/timer'; // eslint-disable-line
import { runStats } from '../utils/stats'; // eslint-disable-line
import { runRss } from '../../global/utils/rssCheck'; // eslint-disable-line
import { runVoiceCheck } from '../../global/utils/voiceExp'; // eslint-disable-line
import { startStatusLoop } from '../utils/statusLoop'; // eslint-disable-line
import { emojiCache } from '../utils/emoji';
import { populateBans } from '../utils/populateBotBans';
// import { runLpm } from '../utils/lpm';

const F = f(__filename);

// Initialize the invite cache
global.guildInvites = new Collection();

/**
 * This gets invites from the guild and stores them in the global.guildInvites object.
 * This must be done onReady because otherwise the Guild isn't ready
 * @param {Client} client
 */
async function getInvites(client: Client) {
  // Loop over all the guilds
  client.guilds.fetch();
  client.guilds.cache.forEach(async (guild:Guild) => {
    if (guild.id !== env.DISCORD_GUILD_ID) return;
    const perms = await checkGuildPermissions(guild, [
      'ManageGuild' as PermissionResolvable,
    ]);

    if (perms.hasPermission) {
      // Fetch all Guild Invites
      const firstInvites = await guild.invites.fetch();
      // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
      global.guildInvites
        .set(guild.id, new Collection(firstInvites
          .map((invite:Invite) => [invite.code, invite.uses])));
    } else {
      const guildOwner = await guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${guild} so I can fetch invites!` }); // eslint-disable-line
    }
  });
}

export default ready;

export const ready: ReadyEvent = {
  name: 'ready',
  once: true,
  async execute(client) {
    await setTimeout(1000);
    const hostGuild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    await checkGuildPermissions(hostGuild, [
      'Administrator' as PermissionResolvable,
    ]).then(async result => {
      if (!result.hasPermission) {
        log.error(F, `I do not have the '${result.permission}' permission in ${hostGuild.name}!`);
        process.exit(1);
      }
      Promise.all([
        startStatusLoop(client),
        getInvites(client),
        runTimer(),
        runStats(),
        runVoiceCheck(),
        runRss(),
        emojiCache(client),
        populateBans(),
        // runLpm(),
      ]).then(async () => {
        const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
        log.info(F, `Discord finished booting in ${bootDuration}s!`);
        if (env.NODE_ENV !== 'development') {
          const botlog = await client.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;
          const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
          const tripbotDevRole = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
          await botlog.send(`Hey ${tripbotDevRole}, bot has restart! Booted in ${bootDuration} seconds`);
        }
      });
    });
  },
};
