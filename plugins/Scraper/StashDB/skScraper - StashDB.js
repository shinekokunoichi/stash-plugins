(async function () {
	let settings = sk.plugins.get('skScraper - StashDB');
    const defaultSettings = {
        update: 'all',
        autoCreate: true,
        create: 'all',
        genderFilter: 'both'
    };

    function genderFilter(gender) {
        let notFilter = true;
        const genderList = gender.split(' ');
        genderList.forEach((value) => {
            if (value != gender.toLowerCase()) notFilter = false;
        });
        return notFilter;
    };

    async function findStudios(studio) {
        let exist = await sk.stashDB.studioExist(studio);
        if (!isNaN(exist)) return exist;
        if (!settings.create.includes('studios')) return;
        exist = await sk.stashDB.toStashStudio(studio);
        exist = await sk.stash.findStudio(studio.name);
        return exist.id;
    };

    async function findPerformers(performers) {
        let ids = [];
        let exist = await sk.stashDB.performersExist(performers);
        ids = exist.find;
        if (!settings.create.includes('performers')) return ids;
        for (performer of exist.notFind) {
            if (genderFilter(performer.gender)) return;
            let newPerformer = await sk.stashDB.toStashPerformer(performer);
            newPerformer = await sk.stash.createPerformer(newPerformer);
            ids.push(newPerformer.id);
        };
        return ids;
    };

    async function findTags(tags) {
        let ids = [];
        let exist = await sk.stashDB.tagsExist(tags);
        ids = exist.find;
        if (!settings.create.includes('tags')) return ids;
        for (tag of exist.notFind) {
            let newTag = await sk.stashDB.toStashTag(tag);
            newTag = await sk.stash.createPerformer(newTag);
            ids.push(newTag.id);
        };
        return ids;
    };

    function alreadyScraped(data) {
        let exist = false;
        data.stash_ids.forEach((id) => {
            if (id.endpoint === sk.stashDB.getGQL()) exist = true;
        });
        return exist
    };

    //HOOK
    async function scrapeScene(data, all) {
        const scene = await sk.stash.findScene(data.id);
        if (alreadyScraped(scene)) return;
        const stashDB = await sk.stashDB.scene(data.title);
        if (!stashDB) return;
        stashDB.studio = await findStudios(stashDB.studio);
        stashDB.performers = await findPerformers(stashDB.performers);
        stashDB.tags = await findTags(stashDB.tags);
        await sk.stashDB.toStash(stashDB, scene.id);
        if (!all) sk.notify(`Scraped ${stashDB.title}`);
    };

    async function scrapePerformer(data, all) {
        const performer = await sk.stash.findPerformer(data.id);
        if (alreadyScraped(performer)) return;
        const stashDB = await sk.stashDB.performer(data.name);
        if (!stashDB) return;
        await sk.stashDB.toStash(stashDB, performer.id);
        if (!all) sk.notify(`Scraped ${stashDB.name}`);
    };

    async function scrapeStudio(data, all) {
        const studio = await sk.stash.findStudio(data.id);
        if (alreadyScraped(studio)) return;
        const stashDB = await sk.stashDB.studio(data.name);
        if (!stashDB) return;
        stashDB.parent = await createStudio(stashDB.parent);
        await sk.stashDB.toStash(stashDB, scene.id);
        if (!all) sk.notify(`Scraped ${stashDB.name}`);
    };

    async function scrapeTag(data, all) {
        const tag = await sk.stash.findTag(data.id);
        if (alreadyScraped(tag)) return;
        const stashDB = await sk.stashDB.tag(data.name);
        if (!stashDB) return;
        await sk.stashDB.toStash(stashDB, tag.id);
        if (!all) sk.notify(`Scraped ${tag.name}`);
    };

    //TASK
    async function scrapeAll() {
        await scrapeScenes();
        await scrapePerformers();
        await scrapeStudios();
        await scrapeTags();
    };

    async function scrapeScenes() {
        const scenes = await sk.stash.findScenes();
        sk.notify(`Scraping ${scenes.length} scenes`);
        for (scene of scenes) {
            await scrapeScene(scene);
        };
        sk.notify(`Finished scraping scenes`);
    };

    async function scrapePerformers() {
        const performers = await sk.stash.findPerformers();
        sk.notify(`Scraping ${performers.length} performers`);
        for (performer of performers) {
            await scrapePerformer(performer);
        };
        sk.notify(`Finished scraping performers`);
    };

    async function scrapeStudios() {
        const studios = await sk.stash.findStudios();
        sk.notify(`Scraping ${studios.length} studios`);
        for (studio of studios) {
            await scrapeStudio(studio);
        };
        sk.notify(`Finished scraping studios`);
    };

    async function scrapeTags() {
        const tags = await sk.stash.findTag();
        sk.notify(`Scraping ${tags.length} tags`);
        for (tag of tags) {
            await scrapeTag(tag);
        };
        sk.notify(`Finished scraping tags`);
    };

    async function main() {
        if (!settings) settings = defaultSettings;
		if (!sk.stashDB.getGQL()) throw Error("StashDB Endpoint doesn't exist");
        settings.update === 'all' ? settings.update = 'scenes, performers, studios, tags' : null;
        settings.create === 'all' ? settings.create = 'scenes, performers, studios, tags' : null;
        settings.genderFilter === 'both' ? settings.genderFilter = 'male, female' : null;
        await sk.useNotification('skScraper - StashDB');
        //HOOK
        if (settings.update.includes('scenes')) sk.hook.watch('scene update', scrapeScene);
        if (settings.update.includes('performers')) sk.hook.watch('performer create', scrapePerformer);
        if (settings.update.includes('studios')) sk.hook.watch('studio create', scrapeStudio);
        if (settings.update.includes('tags')) sk.hook.watch('tag create', scrapeTag);
        //TASK
        sk.task.new('skScraper - StashDB', 'Scrape all', 'Scrape all scene', scrapeAll);
        sk.task.new('skScraper - StashDB', 'Scrape scene', 'Scrape all scene', scrapeScenes);
        sk.task.new('skScraper - StashDB', 'Scrape performer', 'Scrape all scene', scrapePerformers);
        sk.task.new('skScraper - StashDB', 'Scrape studio', 'Scrape all scene', scrapeStudios);
        sk.task.new('skScraper - StashDB', 'Scrape tag', 'Scrape all scene', scrapeTags);
    };

    main();
})();