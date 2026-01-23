(async function () {
    let totalScene, searchedScene, scrapedScene;
    let settings = sk.plugins.get('skScraper - JAV');
    const jav = 'https://njavtv.com'
    const defaultSettings = {
        autoCreate: false,
        create: 'all',
        autoUpdate: true,
        updateFilter: 'all',
        language: 'en',
        fallback: false
    };

    //JAV SEARCH
    function fallback() {
        return settings.language === 'en' ? 'ja' : 'en';
    };

    function haveStashId(data) {
        if (!data.stash_ids[0]) return false;
        return true;
    };

    function getJavCode(data) {
        let code, id;
        let jav = data.code || data.title;
        if (!jav.includes('-')) return false;
        code = jav.split('-')[0];
        id = jav.split('-')[1];
        id = id.includes(' ') ? id.split(' ')[0] : id;
        if (!code || !id) return false;
        return `${code}-${id}`;
    };

    async function searchJav(query, language) {
        language = language || settings.language;
        query = `${jav}/${language}/search/${query}`;
        const search = await sk.scraper.scrape(query, { html: true });
        const result = search.getAll('.thumbnail.group');
        if (!result[0]) return false;
        return result;
    };

    function javSceneUrl(sceneData) {
        return sceneData.firstElementChild.firstElementChild.href;
    };

    function formatInfo(info) {
        info = info.replace('\n                ', '');
        info = info.replace('\n            ', '');
        info = info.replace('\n            ', '');
        info = info.replace('\n        ', '');
        info = info.replace('        ', '');
        info = info.replace('    ', '');
        info = info.replace('    ', '');
        return info;
    };

    async function javScene(sceneData) {
        const scraped = await sk.scraper.scrape(javSceneUrl(sceneData), { html: true });
        const details = scraped.getAll('div.text-secondary');
        let scene = {};
        scene.title = scraped.get('h1').innerText;
        scene.details = scraped.get('.mb-1.text-secondary.break-all.line-clamp-2').innerText;
        details.forEach((info) => {
            info = formatInfo(info.innerText);
            if (info.includes('Release date')) scene.date = info.replace('Release date:', '');
            if (info.includes('Actress')) scene.performer_ids = info.replace('Actress:', '');
            if (info.includes('Series')) scene.groups = info.replace('Series:', '');
            if (info.includes('Genre')) scene.tag_ids = info.replace('Genre:', '');
            if (info.includes('Maker')) scene.studio_id = info.replace('Maker:', '');
            if (info.includes('Director')) scene.director = info.replace('Director:', '');
            if (info.includes('Code')) scene.code = info.replace('Code:', '');
        });
        return scene;
    };

    //CREATE

    async function createPerformers(performers) {
        let ids = [];
        performers = performers.includes(',') ? performers.split(', ') : [performers];
        performers.forEach(async (performer) => {
            let id;
            const exist = await sk.stash.findPerformer(performer);
            if (!exist && settings.autoCreate && settings.create.includes('performers')) {
                await sk.stash.createPerformer({ name: performer });
                id = await sk.stash.findPerformer(performer).id;
            } else if (exist) {
                id = exist.id;
            }
            if (id != undefined && settings.updateFilter.includes('performer')) ids.push(id);
        });
        return ids;
    };

    async function createStudios(studio) {
        const exist = await sk.stash.findStudio(studio);
        let id;
        if (!exist && settings.autoCreate && settings.create.includes('studios')) {
            await sk.stash.createStudio({ name: studio });
            id = await sk.stash.findStudio(studio).id;
        } else if (exist && settings.updateFilter.includes('studios')) {
            id = exist.id;
        };
        return id != undefined ? id : undefined;
    };

    async function createGroups(group) {
        const exist = await sk.stash.findGroup(group);
        let id;
        let result = [];
        if (!exist && settings.autoCreate && settings.create.includes('groups')) {
            await sk.stash.createGroup({ name: group });
            id = await sk.stash.findGroup(group).id;
        } else if (exist) {
            id = exist.id;
        };
        if (id != undefined && settings.updateFilter.includes('groups')) result.push({ group_id: id });
        return result;
    };

    async function createTags(tags) {
        let ids = [];
        tags = tags.includes(',') ? tags.split(', ') : [tags];
        tags.forEach(async (tag) => {
            let id;
            const exist = await sk.stash.findTag(tag);
            if (!exist && settings.autoCreate && settings.create.includes('tags')) {
                await sk.stash.createTag({ name: tag });
                id = await sk.stash.findTag(tag).id;
            } else if (exist) {
                id = exist.id;
            }
            if (id != undefined && settings.updateFilter.includes('tags')) ids.push(id);
        });
        return ids;
    };

    async function sceneUpdate(data) {
        if (haveStashId(data)) return;
        const javCode = getJavCode(data);
        const index = javCode[0] === '0' ? javCode.substring(1) : javCode;
        if (!javCode) return;
        let javData = await searchJav(javCode);
        if (!javData && settings.fallback) javData = await searchJav(javCode, fallback())
        if (!javData) {
            sk.notify(`${javCode} not found`);
            return;
        }
        let scene = await javScene(javData[0]);
        scene.cover_image = `https://fourhoi.com/${javCode.toLowerCase()}/cover-n.jpg`;
        scene.id = data.id;

        let performers, studios, groups, tags;

        if (scene.performer_ids) scene.performer_ids = await createPerformers(scene.performer_ids);
        if (scene.studio_id) scene.studio_id = await createStudios(scene.studio_id);
        if (scene.studio_id === undefined) delete scene.studio_id;
        if (scene.tag_ids) scene.tag_ids = await createTags(scene.tag_ids);
        if (scene.groups) scene.groups = await createGroups(scene.groups);
        if (scene.groups[0]) scene.groups[0].scene_index = index;
        const updated = await sk.stash.updateScene(scene);
        return updated;
    };

    async function scrapeScene(scenes) {
        totalScene = scenes.length;
        searchedScene = 0;
        scrapedScene = 0
        scenes.forEach(async (scene) => {
            const updated = await sceneUpdate(scene);
            searchedScene++
            if (updated) scrapedScene++
        });
        return searchedScene;
    };

    function getDate() {
        const date = new Date();
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    };

    //HOOK
    async function scrapeOne(data) {
        await scrapeScene([data]);
        checkFinish();
    };

    //TASK

    async function scrapeAll() {
        const scenes = await sk.stash.findScenes();
        sk.notify(`Searching for JAV in ${scenes.length} scenes...`);
        await scrapeScene(scenes);
        checkFinish();
    };

    function checkFinish() {
        if (totalScene === searchedScene) {
            sk.notify(`Finished scraping, found a total of ${scrapedScene} JAV scene`);
        } else {
            setTimeout(checkFinish, 1000);
        };
    };

    //MAIN

    async function main() {
        if (!settings) settings = defaultSettings;
        settings.create === 'all' ? settings.create = 'performers, studios, groups, tags' : null;
        settings.updateFilter === 'all' ? settings.updateFilter = 'performers, studios, groups, tags' : null;
        await sk.useNotification('skScraper - JAV');
        //HOOK
        if (settings.autoUpdate) sk.hook.watch('scene update', scrapeOne);
        //TASK
        sk.task.new('skScraper - JAV', 'Scrape all', 'Scrape all scene', scrapeAll);
    };

    main();
})();