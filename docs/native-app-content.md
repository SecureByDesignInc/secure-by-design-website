# Native app content feed

The Secure By Design app (SecureByDesignInc/secure-by-design-native-app) reads its Training Library
courses and the Inside the Network reference from this Site, so a website deploy updates the app
without an App Store release.

## How an update reaches the app

1. **Build.** `pnpm build` runs `scripts/prepare-app-content.mjs`, which builds
   `public/app/content/v1.json` from `content/videos.json`, `content/configuration-courses.json`, the
   DC01/DC02 and RMF training packages, and `public/inside-network-model/`. The build stops if a lesson
   is missing from `content/training-progress.json`, because account sync would reject it.
   `tests/app-content.test.mjs` checks the shape installed apps parse.
2. **Deploy.** `.github/workflows/deploy.yml` confirms https://securebydesigninc.com/app/content/v1.json
   serves the new content version, then notifies the app repository.
3. **Installed apps.** The app checks the feed on launch and whenever it returns to the foreground
   (ETag, so an unchanged check transfers almost nothing). A valid new version is saved on the device
   and shown right away. If the feed can't be reached or doesn't parse, the app keeps the last good
   copy, then its bundled copy.
4. **App builds.** The app repository's *Sync website content* workflow copies the feed into the app's
   bundled offline content (`assets/training/content.json`). If the content changed and the Flutter
   checks pass, it commits to `main`, and Codemagic builds a TestFlight release. If the checks fail
   (for example, a test that pins the course list), it opens a pull request instead.

App code changes (new screens or features) still go through the app repository and TestFlight/App
Store review as before. Only content travels through the feed.

## Rules

- Keep lesson and material IDs stable. Saved progress and bookmarks are keyed by them; when a lesson
  moves, add the mapping in both the app's `LearningStore._movedLessons` and the server migration.
- The feed's `schema` is 1. Change it only for a breaking change to the shape, together with an app
  release that reads the new schema: installed apps ignore any other schema and keep their bundled
  content.
- The feed is deterministic. Its `version` is a hash of the content, so a deploy that doesn't change
  training content doesn't trigger an app build.

## Setup

The deploy notifies the app repository with the `APP_REPO_DISPATCH_TOKEN` repository secret: a
fine-grained personal access token limited to `SecureByDesignInc/secure-by-design-native-app` with
**Contents: Read and write**. Without it, nothing fails; the app repository's daily scheduled sync picks
up the change instead, and installed apps already read the live feed either way.

## Local commands

```bash
node scripts/prepare-app-content.mjs            # write public/app/content/v1.json
node scripts/prepare-app-content.mjs --stdout   # print it (the app's tool/sync_site_content.mjs uses this)
node --test tests/app-content.test.mjs
```
