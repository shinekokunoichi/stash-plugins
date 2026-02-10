(() => {
    const pluginName = 'skScraper - JAV';
    let settings, total, searched, scraped, alreadyscraped;

    function enabled(category) {
        const active = settings.createFilter;
        const filter = settings.createFilter.toLowerCase().includes(category);
        const all = settings.createFilter.toLowerCase() === 'all';
        if (!active) return false;
        if (!filter && !all) return false;
        return true;
    };

    //Creator
    async function create(category, data) {
        let ids = [];
        for (name of data) {
            let id;
            const options = { filter: { q: name }, fields: 'id' };
            const exist = await sk.stash.find[category](options);
            if (!exist && enabled(category)) {
                const created = await sk.stash.create[category]({ name: name });
                id = created.id;
            };
            if (exist) id = exist.id;
            if (id !== undefined) ids.push(id);
        };
        if (category === 'studio' && ids[0] === undefined) return;
        return category === 'studio' ? ids[0] : ids;
    };

    //Scraper
    async function scrape(scene) {
        //If have already a stashDB or skScraperJav id return
        let dontScrape = false;
        scene.stash_ids.forEach((stashId) => {
            if (!settings.forceScrape && stashId) dontScrape = true;
            if (settings.forceScrape && stashId.endpoint === 'skScraperJav') dontScrape = true; 
        });
        if (dontScrape) {
            alreadyscraped++;
            return;
        };
        const title = scene.code || scene.title;
        //If the scene is not a JAV code return xxx-123
        if (!title.includes('-')) return;
        const [code, id] = title.split('-');
        if (!isNaN(code) && isNaN(id)) return;
        const javCode = `${code}-${id}`.toUpperCase();
        //Scrape for results
        const javData = await sk.tool.scrape(`https://www.javmost.ws/search/${javCode}/`, { html: true });
        const results = javData.get('.card');
        if (!results) return;
        //Set scraped metadata
        const data = {};
        const date = new Date();
        const skID = { stash_id: javCode, endpoint: 'skScraperJav', updated_at: date.toISOString() };
        data.stash_ids = scene.stash_ids;
        data.stash_ids.push(skID);
        data.id = scene.id;
        data.cover_image = `https://img3.javmost.ws/images/${javCode}.webp`;
        data.title = results.get('h2').read();
        data.code = results.get('h1').read();
        data.groups = code.toUpperCase();
        data.date = results.get('p').read().replaceAll(' ', '').split('Release')[1].split('Time')[0];
        results.getAll('p a').forEach((info) => {
            if (info.url().includes('/star/')) data.performer_ids ? data.performer_ids.push(info.read()) : data.performer_ids = [info.read()];
            if (info.url().includes('/category/')) data.tag_ids ? data.tag_ids.push(info.read()) : data.tag_ids =[info.read()];
            if (info.url().includes('/director/')) data.director = info.read();
            if (info.url().includes('/maker/')) data.studio_id = info.read();
        });
        //Bind stash id and if not exist create
        if (data.performer_ids) data.performer_ids = await create('performer', data.performer_ids);
        if (data.tag_ids) data.tag_ids = await create('tag', data.tag_ids)
        if (data.groups) data.groups = await create('group', data.groups);
        if (data.studio_id) data.studio_id = await create('studio', [data.studio_id]);
        if (data.studio_id === undefined) delete data.studio_id;
        if (data.groups[0]) data.groups[0].scene_index = id[0] === '0' ? id.substring(1) : id;
        const updated = await sk.stash.update.scene(data);
        return updated;
    };

    async function start(scenes) {
        total = scenes.length;
        searched = 0;
        scraped = 0;
        alreadyscraped = 0;
        for (scene of scenes) {
            const find = await scrape(scene);
            searched++;
            if (find) scraped++;
        };
    };

    function finish() {
        if (total === searched) sk.tool.notify(pluginName, `Finished scraping, scraped a total of ${scraped} and ${alreadyscraped} already scraped JAV scenes`);
        if (total !== searched) setTimeout(finish, 1000);
    };

    //Hook
    async function scrapeOne(data) {
        const scene = await sk.stash.find.scene(data.id);
        await start([scene]);
        finish();
    };

    //Task
    async function scrapeAll() {
        const scenes = await sk.stash.find.scenes();
        sk.tool.notify(pluginName, `Searching for JAV in ${scenes.length} scenes...`);
        await start(scenes);
        finish();
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                forceScrape: false,
                autoCreate: false,
                createFilter: 'all',
                autoUpdate: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        if (settings.autoUpdate) sk.hook.add([{ category: 'scene', operation: 'update', callback: scrapeOne }]);
        sk.task.add([{ id: pluginName, name: 'Scrape All', description: 'Scrape all scene', callback: scrapeAll }]);
    };

    main()
})();