# Stash Plugins
Do you have any plugin ideas? DM to discord or open a issue with your ideas!
## Installation
https://shinekokunoichi.github.io/stash-plugins/main/index.yml

<img width="446" height="354" alt="image" src="https://github.com/user-attachments/assets/96151086-5ae3-410c-b9ec-8d234418693e" />

## Note
Change plugins settings after installing them otherwise will use the default settings!
Issues/Suggestion: If you have some issues with my plugins, open a new issue with title "{Plugin Name} - Shortened Problem". I will fix it as fast as I can.
CORS: When a plugin have the CORS requirement you need a special CORS addon to bypass bad request from website server. I suggest <a href="https://chromewebstore.google.com/detail/cors-unblock/odkadbffomicljkjfepnggiibcjmkogc">this addons</a> as it can be enabled only for stash host. Thanks to my main API any request that are not from stash and my plugins to external server will be blocked anyway!
## API
### Shinobi-Api
Version: 1.1
Description: Custom Stash API powers all my plugins. It's free to use for others under the CC-BY-NC-ND-4.0 copyright. The API is fully commented in ECMA Script. If I get multiple requests for the API, I'll create a page with instructions for the basic functions.
Current Modules:
- UI: Graphic manipulator
- Stash: Stash interaction
- Plugins: Plugins manager
- StashDB: StashDB interaction
- Hook: Custom hook and watcher
- Task: Custom task
- Scraper: Integrated scraper
## Scraper
### JAV
Version: 1.1
Description: Custom JAV scraper. Require CORS
- Metadata in english and japanese
- Auto updater on scene updating
- Filter for field during scraping
- Auto creation missing metadata
- Filter for auto creation
- Fallback option to change metadata language temporarily for the current scraping scene
- ### StashDB
Version: 1.0
Description: Auto update scenes, performers, groups and tags using StashDB (based on name and title)
- Auto update and task update
- Auto creation missing data
- Filter for auto creation
- Filter for performers gender creation
## UI
### Rating
Version: 1.0
Description: Style card based on rating
- Color cards based on given color code for each rating
## Tags
Version: 1.0
Description: Colorize tags based on their parent tag/s
- Colorize every tags with colors based on their parents tag
## Downloader
### JAV
Examples of the tasks "Search by code"
<img width="1846" height="495" alt="Untitled (1)" src="https://github.com/user-attachments/assets/be5a6048-0fa4-4abd-89c5-4ca49cc2a9b7" />

Version: 1.0
Description: Suggestion and downloader of JAV directly from Stash. Read the guide. Need CORS
- Download avaiable in english and japanese
- Make a custom pop-up to show all the video previews
- Suggest by favorite performers/tags or by custom search (see plugin tasks)
- When searching by code will show related video code
- Need conversion for the downloaded video, read the Guide.txt inside the plugins folder
