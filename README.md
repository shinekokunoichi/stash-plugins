# Stash Plugins
Do you have any plugin ideas? DM to discord or open a issue with your ideas!
## Installation
https://shinekokunoichi.github.io/stash-plugins/main/index.yml

<img width="446" height="354" alt="image" src="https://github.com/user-attachments/assets/96151086-5ae3-410c-b9ec-8d234418693e" />

## Note
- Change plugins settings after installing them otherwise will use the default settings!
- Issues/Suggestion: If you have some issues with my plugins, open a new issue with title "{Plugin Name} - Shortened Problem". I will fix it as fast as I can.
- CORS: When a plugin have the CORS requirement you need a special CORS addon to bypass bad request from website server. I suggest <a href="https://chromewebstore.google.com/detail/cors-unblock/odkadbffomicljkjfepnggiibcjmkogc">this addons</a> as it can be enabled only for stash host. Any request that are not from stash and my plugins to external server will be blocked anyway.
## API
### Shinobi-Api
- Version: 2.0
- Description: Custom Stash API powers all my plugins. It's free to use for others under the CC-BY-NC-ND-4.0 copyright. The API is fully commented in JSDoc. If I get multiple requests for the API, I'll create a page with instructions for the basic functions.
- Current Modules:
  - Tool: Scraper, watcher and custom getter
  - UI: Graphic manipulator
  - Stash: Stash interaction
  - Plugin: Plugins manager
  - StashDB: StashDB interaction
  - Hook: Custom hook and watcher
  - Task: Custom task
## Scraper
### JAV
- Version: 2.0
- Description: Custom JAV scraper. Require CORS.
  - Auto updater on scene updating
  - Filter for field during scraping
  - Auto creation missing metadata
  - Filter for auto creation
### StashDB
- Version: 2.0
  - Description: Auto update scenes, performers, groups and tags using StashDB (based on name and title)
  - Auto update and task update
  - Auto creation missing data
  - Filter for auto creation
  - Filter for performers gender creation
## UI
### Rating
- Version: 2.0
- Description: Style card based on rating.
  - Color cards based on given color code for each rating
  - Supports decimal rating system mixing the colors. Ex 3.3 will be a mix made by rating 3 and rating 3 with low intensity.
## Search
<img width="1268" height="118" alt="image" src="https://github.com/user-attachments/assets/b8c24736-f2ae-4428-9953-a0313e8322bd" />

- Version: 1.0
- Description: Set a custom search filter by alphabetical order. Note: after selecting a filter you need to double-click the next one! 
  - Avaiable for every category.
## Tags
- Version: 2.0
- Description: Colorize tags based on their parent tag/s.
  - Colorize every tags with colors based on their parents tag
