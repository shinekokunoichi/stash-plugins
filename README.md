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
Custom Stash API powers all my plugins. It's free to use for others under the CC-BY-NC-ND-4.0 copyright. The API is fully commented in JSDoc. If I get multiple requests for the API, I'll create a page with instructions for the basic functions.
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
Custom JAV scraper. Require CORS.
- Can force replace already scraped data
- Auto updater on scene updating
- Filter for field during scraping
- Auto creation missing metadata
- Filter for auto creation
### StashDB
Auto update scenes, performers, groups and tags using StashDB (based on name and title)
- Can force replace already scraped data
- Auto update and task update
- Auto creation missing data
- Filter for auto creation
- Filter for performers gender creation
## UI
### All
Install all UI customization at once.
### Assets
Assets images used by others skPlugins
### Brand
<img width="229" height="36" alt="Screenshot 2026-02-08 022037" src="https://github.com/user-attachments/assets/f965c5b4-9c0b-4981-97e7-7efb52c390e1" />
<img width="1839" height="59" alt="Screenshot 2026-02-08 022119" src="https://github.com/user-attachments/assets/ac46d974-b1a4-412d-80d1-ef6f13dd4011" />

UI customization for Stash name, logo and icon.
- Change Brand name with text or a custom logo
- Remove brand or brand in tabs name
- Can set a custom icon
### Icon
<img width="1836" height="52" alt="Screenshot 2026-02-08 020622" src="https://github.com/user-attachments/assets/21b8586c-d427-42c4-be0d-6159ce31c55f" />
<img width="1846" height="59" alt="Screenshot 2026-02-08 020537" src="https://github.com/user-attachments/assets/68feddfd-534b-42fe-8241-65169cf2d9a8" />

Customization for icon and navbar.
- Can set the navbar menu to be: both (default), only text or only icon
- Can change the default icon with emoji or image
### Rating
<img width="611" height="592" alt="Screenshot 2026-02-08 022222" src="https://github.com/user-attachments/assets/e021d887-f9cc-4a36-ab58-86dabb82cc74" />

Style card based on rating.
- Color cards based on given color code for each rating
- Supports decimal rating system mixing the colors. Ex 3.3 will be a mix made by rating 3 and rating 4 with low intensity.
### Search
<img width="1268" height="118" alt="image" src="https://github.com/user-attachments/assets/b8c24736-f2ae-4428-9953-a0313e8322bd" />

Set a custom search filter by alphabetical order. Note: after selecting a filter you need to double-click the next one! 
- Avaiable for every category.
### Tags
<img width="496" height="298" alt="Screenshot 2026-02-08 022257" src="https://github.com/user-attachments/assets/c8a02bbe-18c9-42bd-b07f-c43bf83b11cf" />

Colorize tags based on their parent tag/s.
- Colorize every tags with colors based on their parents tag
