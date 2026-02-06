(() => {
    const pluginName = 'skScraper - StashDB';
    let settings, category, total, searched, scraped, alreadyScraped;

    function canCreate() {
        const active = settings.autoCreate;
        const filter = settings.createFilter.includes(category);
        const all = settings.createFilter === 'all';
        if (!active) return false;
        if (!filter && !all) return false;
        return true;
    };

    async function scrape(data) {
        const search = data.name || data.title;
        let dontScrape = false;
        data.stash_ids.forEach((stashId) => { if (stashId.endpoint === 'https://stashdb.org/graphql' && !settings.forceScrape) dontScrape = true; });
        if (dontScrape) {
            alreadyScraped++;
            return;
        };
        const stashDB = await sk.stashDB.find[category](search);
        if (!stashDB) return;
        const options = {
            update: data.id,
            create: canCreate()
        };
        const stash = await sk.stashDB.toStash(stashDB, options);
        scraped++;
    };

    async function start(data) {
        total = data.length;
        searched = 0;
        scraped = 0;
        alreadyScraped = 0;
        created = 0;
        for (entry of data) {
            const find = await scrape(entry);
            searched++;
            if (find) scraped++;
        };
    };

    function finish() {
        if (total === searched) sk.tool.notify(pluginName, `Finshed scraping ${category}.\nScraped a total of ${scraped}\nAlready scraped ${alreadyScraped}`);
        if (total !== searched) setTimeout(finish, 1000);
    };

    //Hook
    async function scrapeOne(data) {
        category = data.__typename.toLowerCase()
        await start([data]);
        finish();
    };

    //Task
    async function scrapeAll(scraping) {
        category = scraping.substring(0, scraping.length - 1);
        if (!category === 'all') {
            const data = await sk.stash.find[scraping];
            await start(data);
        } else {
            const scenes = await sk.stash.find.scenes();
            const performers = await sk.stash.find.performers();
            const studios = await sk.stash.find.studios();
            const tags = await sk.stash.find.tags();
            await start(scenes);
            await start(performers);
            await start(studios);
            await start(tags);
        };
        finish();
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                forceScrape: false,
                autoUpdate: true,
                updateFilter: 'all',
                autoCreate: false,
                createFilter: 'all',
                genderFilter: 'both'
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        if (!sk.stashDB.canUse()) {
            sk.tool.notify(pluginName, 'StashDB endpoint is not setted');
            return;
        };
        //Hook
        if (settings.autoUpdate) {
            const hookFilter = settings.updateFilter;
            let hooks = [];
            if (hookFilter.includes('scenes') || hookFilter === 'all') hooks.push({ category: 'scene', operation: 'update', callback: scrapeOne });
            if (hookFilter.includes('performers') || hookFilter === 'all') hooks.push({ category: 'performer', operation: 'update', callback: scrapeOne });
            if (hookFilter.includes('studios') || hookFilter === 'all') hooks.push({ category: 'studio', operation: 'update', callback: scrapeOne });
            if (hookFilter.includes('tags') || hookFilter === 'all') hooks.push({ category: 'tag', operation: 'update', callback: scrapeOne });
            sk.hook.add(hooks);
        };
        //Task
        sk.task.add([
            { id: pluginName, name: 'Scrape All', description: 'Scrape all Stash library', callback: scrapeAll, arg: 'all' },
            { id: pluginName, name: 'Scrape Scenes', description: 'Scrape all scenes', callback: scrapeAll, arg: 'scenes' },
            { id: pluginName, name: 'Scrape Performers', description: 'Scrape all performers', callback: scrapeAll, arg: 'performers' },
            { id: pluginName, name: 'Scrape Studios', description: 'Scrape all studios', callback: scrapeAll, arg: 'studios' },
            { id: pluginName, name: 'Scrape Tags', description: 'Scrape all tags', callback: scrapeAll, arg: 'tags' },
        ]);
    };

    main();
})();