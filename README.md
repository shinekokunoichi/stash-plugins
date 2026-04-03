# Stash Plugins
Do you have any plugin ideas? DM to discord or open a issue with your ideas!

## Installation
https://shinekokunoichi.github.io/stash-plugins/main/index.yml

<img width="443" height="357" alt="image" src="https://github.com/user-attachments/assets/e1b4fe81-e9ff-4f81-a69b-c278d3bc3b18" />

## Version Legend
1.2.3.4
- 1: Rework or major update like speed, big new function, etc
- 2: Minor update small function
- 3: Bug fixes
- 4: Minor fixes typo, micro change in function, description, etc

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

### skAwesomplete
Awesomplete with custom style and compatibility with Shinobi-Api

## Extra

### Metadata-Parser
Apply and create metadata based on path and file name. High customization, read How to.txt to see how to set up.
- Infinite rule for path exceptions
- Auto create missing metadata
- Simple and dynamic field (read How to.txt for details)
- Support metadata parsing form path and filename

### Most-Used
<img width="905" height="446" alt="image" src="https://github.com/user-attachments/assets/c1b43029-e88b-4fb8-a457-e392e71a5d3e" />

Add custom stats to stash. Currently add a crown bases on top 3 elements for scenes images groups performers studios in card and page.
- Enable/disable card and page
- Can show infinite number of same ranking

### Multiple-Performer-Images
<img width="690" height="167" alt="image" src="https://github.com/user-attachments/assets/e4edd98b-3548-4ef1-804a-06bf2a831020" />
<img width="690" height="176" alt="image" src="https://github.com/user-attachments/assets/29f171b0-47a5-4415-bca4-0226d08aeb13" />

Enable the possibility to have multiple performer images by a custom GUI inside the performer page.
- Simple GUI to choose and change custom images from the performer page
- Have a set of preset name - portrait, clothed, skimpy and nude
- Can create and use an unlimited amounts of custom name
- Change the performer image with dots system
- Can replace all performer preview with the selected default image
- If Stash is in SFW mode will auto-change image to clothed if available
- Can select a random image to display

### Related-Content
<img width="397" height="501" alt="image" src="https://github.com/user-attachments/assets/84e59713-9774-4c7d-af22-97bfefbfd8cc" />

Add a section inside page category to show related one, automatic and manual (currently only for performers).
- Automatic suggestion based on tags
- Manual link creation with dropdown
- Can auto-link performers

### Tags-Color
<img width="496" height="298" alt="image" src="https://github.com/user-attachments/assets/580dbda4-77d6-47f6-8c35-75d79d03967c" />

Colorize tags based on their parent tag/s.
- Colorize every tags with colors based on their parents tag

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
Install all UI customization at once. (currently not working until yml parse fix)

### Assets
Assets images used by others skPlugins

### Brand
<img width="229" height="36" alt="image" src="https://github.com/user-attachments/assets/1218d3eb-4f14-4892-936c-80e95af045bb" />
<img width="690" height="22" alt="image" src="https://github.com/user-attachments/assets/6b0de6da-cc57-4c4a-b406-833b8ed0d53f" />

UI customization for Stash name, logo and icon.
- Change Brand name with text or a custom logo
- Remove brand or brand in tabs name
- Can set a custom icon

### Galleries
UI customization for gallery cards and page
- Can remove infos
- Can remove popovers
- Can remove popovers count
- Apply a style when organized

### Groups
UI customization for group cards
- Can remove infos
- Can remove popovers
- Can remove popovers count

### Icon
<img width="690" height="19" alt="image" src="https://github.com/user-attachments/assets/926980be-3b37-43b0-a1e9-dc0abe782c7c" />
<img width="690" height="22" alt="image" src="https://github.com/user-attachments/assets/888fa79e-f049-49ca-9dd0-a0a891f0c43e" />

Customization for icon and navbar.
- Can set the navbar menu to be: both (default), only text or only icon
- Can change the default icon with emoji or image

### Images
UI customization for image cards and page
- Can remove infos
- Can remove popovers
- Can remove popovers count
- Apply a style when organized

### Markers
UI customization for marker cards
- Can remove infos
- Can remove popovers
- Can remove popovers count

### Performers
UI customization for performer cards
- Can remove infos
- Can remove popovers
- Can remove popovers count

### Rating
<img width="510" height="500" alt="image" src="https://github.com/user-attachments/assets/48a391cc-8812-4d86-ba17-2cc7099502db" />

Style card and page based on rating.
- Color cards and page based on given color code for each rating
- Supports decimal rating system mixing the colors. Ex 3.3 will be a mix made by rating 3 and rating 4 with low intensity.

### Scenes
UI customization for scene cards and page
- Can remove infos
- Can remove popovers
- Can remove popovers count
- Apply a style when watched
- Apply a style when organized
- Auto hide details in page
- Different theatre mode for page

### Search
<img width="1268" height="118" alt="image" src="https://github.com/user-attachments/assets/db874e98-94c5-4943-aad0-4c7106999430" />

Set a custom search filter by alphabetical order. Note: after selecting a filter you need to double-click the next one! 
- available for every category.

### Studios
UI customization for studio cards
- Can remove infos
- Can remove popovers
- Can remove popovers count

### Tags
UI customization for tag cards
- Can remove infos
- Can remove popovers
- Can remove popovers count

### Theme
Customize your stash theme with a simple UI
<img width="1852" height="51" alt="image" src="https://github.com/user-attachments/assets/85a66e29-9458-407f-89a5-827ad981da1d" />
<img width="477" height="976" alt="image" src="https://github.com/user-attachments/assets/a35bcec6-1147-4919-bcc4-a0fca3a70786" />
<img width="507" height="968" alt="image" src="https://github.com/user-attachments/assets/45a0aedf-ba1a-45cc-8534-58fb75d12b52" />

- Easy UI to edit almost all Stash and My plugins,
- Infinite number of custom themes
- Abitlity to share one or all theme to other users
- Simple backup import/export of all themes
