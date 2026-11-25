# The /admin page: one-time setup

`https://bible.nrnszn.com/admin` is the owner's page, built the same way as the other NuRenaissance apps: a password sign-in, then a few folders.
Nobody who is not signed in sees anything except the password box. The page is kept out of search results and the sitemap.

Inside, once signed in:
- **Status**: which Cloudflare connections exist (the AI connection, the counters store, the password). Yes or no, never a value.
- **AI contract review**: whether it is on, and how much of today's free budget has been used.
- **Content freshness**: when the data and guides were last verified, which facts need a person to re-check, and links to the audit issues and automatic checks on GitHub.
- **Account**: the app version, **Refresh the app**, and **Sign out on this device**.

The app stores nothing about visitors, so there is no visitor data here.

## Switch it on (about 3 minutes)
1. Make up a long password (at least 10 characters). A few random words works well. Keep it in your password manager.
2. Cloudflare dashboard, then **Workers & Pages**, the **the-artist-bible** project, **Settings**, **Variables and Secrets**, **Add**. Choose type **Secret**, name exactly `ADMIN_PASSWORD`, value = your password, **Save**.
3. **Deployments**, the latest one, **...**, **Retry deployment** (secrets only apply to a new deployment).
4. Open `https://bible.nrnszn.com/admin`, type the password, **Sign in**. You stay signed in on that device for 30 days.

Until steps 2 and 3 are done, the page says "Sign-in is not set up yet" and explains how.

## Good to know
- **Changing the password signs every device out.** Change `ADMIN_PASSWORD` in Cloudflare and retry the deployment.
- **Five wrong passwords from one address lock that address out for 15 minutes.** The counter is kept in the same counters store the AI review uses (the `BUDGET` KV binding) as a scrambled value that expires on its own. Without that store it is kept in memory and slows guessing down instead of stopping it, so use a long password.
- **Sign out on a shared or borrowed device** with Account, **Sign out on this device**.
- The page can only read. It cannot change anything.
- The sign-in token lives in this browser under its own key (`artist_bible_admin`), never inside your saved work.

## "Tap to update"
When a new version is published, a small bar appears at the bottom of the app: **A new version is ready. Tap to update.** Tapping it clears the saved app files on that device and reloads. Saved songs, releases, drafts and backups are not touched.
- Each build writes `dist/version.json` (`scripts/stamp-version.mjs`). The app compares it with the version it opened with: when it returns to the screen, when the phone goes back online, and every 5 minutes.
- The short number (1.1, 1.2 ...) comes from the newest `## x.y` heading in `CHANGELOG.md`. **Every change people can see adds a block at the top of `CHANGELOG.md` and goes up one step.**
