(() => {
    const pluginName = 'skScraper - JAV';
    let scrapeResults, dryRun, selectedScraperData;
    let whatWillCreate = {};

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Tasks
        setTasks();

        // Hooks
        setHooks();

        // Compatibility
        skManagerCompatibility();
        skKeybinderCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                create: false,
                createFilter: 'performers, studios, groups, tags',
                autoScrape: true
            }
        });
    };

    // Tasks
    function setTasks() {
        sk.task.add(
            {
                id: pluginName,
                name: 'GUI',
                description: 'Open the scraper GUI',
                callback: scraperGUI
            },
            {
                id: pluginName,
                name: 'Scrape',
                description: 'Scrape all scene (without any StashID)',
                callback: scrapeNoGUI
            },
            {
                id: pluginName,
                name: 'Force scrape',
                description: 'Scrape all scene (forced)',
                callback: () => scrapeNoGUI(true)
            }
        );
    };

    async function scraperGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skScraper_JAV_GUI',
            class: 'main container-fluid bg-dark',
            flex: true,
            style: {
                'flex-direction': 'column',
                top: 0,
                width: '100%',
                height: '100%'
            }
        });
        const title = sk.ui.make.title({ text: pluginName });
        const close = sk.ui.make.button({
            text: 'Close',
            class: 'btn btn-danger',
            style: {
                position: 'absolute',
                top: 0,
                right: 0
            },
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        })
        const card = sk.ui.make.container({
            class: 'card',
            style: {
                width: '100%',
                height: '90%',
                'overflow-y': 'auto'
            }
        });

        card.append(await GUIScrape());

        gui.append(close, title, card);
        document.body.append(gui.element);
    };

    async function GUIScrape() {
        const scraperContainer = sk.ui.make.container({
            flex: true,
            style: {
                'flex-direction': 'column',
                width: '100%',
                'justify-content': 'flex-start',
                'align-items': 'flex-start'
            }
        });
        const title = sk.ui.make.title({
            id: 'skScraper_JAV_Progress',
            text: 'Scraper'
        });

        const card = sk.ui.make.container({
            flex: true,
            style: {
                width: '100%',
                'flex-direction': 'column',
                'align-items': 'flex-start'
            }
        });

        const searchContainer = sk.ui.make.container({ flex: true });
        const noEndpointScene = sk.ui.make.button({
            text: 'Scenes - no endpoint',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData()
            }
        });
        const alsoEndpointScene = sk.ui.make.button({
            text: 'Scenes - all',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData(true)
            }
        });
        const updateScraped = sk.ui.make.button({
            text: 'Update selected scraped data',
            class: 'btn btn-danger',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: updateSelectedScrapedData
            }
        });
        const selectAllScraped = sk.ui.make.button({
            text: 'Select all scraped data',
            class: 'btn btn-success',
            event: {
                type: 'click',
                callback: () => sk.tool.getAll('.skScraper_JAV_ResultsRow').forEach(row => row.click())
            }
        });
        searchContainer.append(noEndpointScene, alsoEndpointScene, updateScraped, selectAllScraped);


        const resultsContainer = sk.ui.make.container({
            id: 'skScraper_JAV_Results',
            style: {
                width: '100%',
                display: 'grid'
            }
        });
        const resultsHeader = sk.ui.make.container({
            class: 'bg-dark',
            flex: true,
            style: {
                width: '100%',
                'margin-top': '1rem',
                'justify-content': 'space-around'
            }
        });
        const fixedWidth = { width: '150px' };
        const resultsId = sk.ui.make.subTitle({
            text: 'Id',
            style: fixedWidth
        });
        const resultsTitle = sk.ui.make.subTitle({
            text: 'Title',
            style: fixedWidth
        });
        const resultsCode = sk.ui.make.subTitle({
            text: 'Code',
            style: fixedWidth
        });
        const resultsDate = sk.ui.make.subTitle({
            text: 'Date',
            style: fixedWidth
        });
        const resultsPerformers = sk.ui.make.subTitle({
            text: 'Performer/s',
            style: fixedWidth
        });
        const resultsTags = sk.ui.make.subTitle({
            text: 'Tag/s',
            style: fixedWidth
        });
        const resultsStudio = sk.ui.make.subTitle({
            text: 'Studio/s',
            style: fixedWidth
        });
        const resultsIndex = sk.ui.make.subTitle({
            text: 'Index',
            style: fixedWidth
        });
        const resultsGroups = sk.ui.make.subTitle({
            text: 'Group/s',
            style: fixedWidth
        });

        resultsHeader.append(resultsId, resultsTitle, resultsCode, resultsDate, resultsPerformers, resultsTags, resultsStudio, resultsIndex, resultsGroups);
        resultsContainer.append(resultsHeader);

        card.append(searchContainer, resultsContainer);

        scraperContainer.append(title, card);
        return scraperContainer;
    };

    async function searchScraperData(forceScrape) {
        const progress = sk.tool.get('#skScraper_JAV_Progress');
        const resultsContainer = sk.tool.get('#skScraper_JAV_Results');
        const resultsHeader = resultsContainer.child()[0];
        resultsContainer.write('', true);
        resultsContainer.append(resultsHeader);

        progress.write('Scraper - Loading...');

        let scenes = await sk.stash.find.scenes({ fields: 'id title code stash_ids { endpoint }' });
        prepareScrapeResults(scenes);
        scenes = scenes.filter(scene => canScrape(scene, forceScrape));

        progress.write(`Scraper - Scraping 0/${scenes.length} scenes`);
        sk.tool.notify(pluginName, `Scraping ${scenes.length} scenes`);

        dryRun = true;

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const scrapedData = await stashIdToName(await scrapeJAV(scene));
            
            const row = sk.ui.make.container({
                class: 'btn-danger skScraper_JAV_ResultsRow',
                flex: true,
                style: {
                    width: '100%',
                    padding: '1rem 0',
                    cursor: 'pointer',
                    'justify-content': 'space-around',
                    'border-top': '.25rem solid rgba(0,0,0,0.1)'
                },
                event: {
                    type: 'click',
                    callback: () => checkScraperData(scene, row)
                }
            });
            const fixedWidth = { width: '150px' };
            const resultsId = sk.ui.make.description({
                text: scene.id,
                style: fixedWidth,
                event: {
                    type: 'click',
                    callback: () => window.open(`${window.location.origin}/scenes/${scene.id}`, '_blank').focus()
                }
            });
            const resultsTitle = sk.ui.make.description({
                text: scrapedData.title || '',
                style: fixedWidth
            });
            const resultsCode = sk.ui.make.description({
                text: scrapedData.code || '',
                style: fixedWidth
            });
            const resultsDate = sk.ui.make.description({
                text: scrapedData.date || '',
                style: fixedWidth
            });
            const resultsPerformers = sk.ui.make.description({
                text: `Find: ${scrapedData._performers || ''}\nCreate: ${whatWillCreate.performer || ''}`,
                style: fixedWidth
            });
            const resultsTags = sk.ui.make.description({
                text: `Find: ${scrapedData._tags || ''}\nCreate: ${whatWillCreate.tag || ''}`,
                style: fixedWidth
            });
            const resultsStudio = sk.ui.make.description({
                text: `Find: ${scrapedData._studio || ''}\nCreate: ${whatWillCreate.studio || ''}`,
                style: fixedWidth
            });
            const resultsIndex = sk.ui.make.description({
                text: scrapedData.groups ? scrapedData.groups[scrapedData.groups.length - 1].scene_index || '' : '',
                style: fixedWidth
            });
            const resultsGroups = sk.ui.make.description({
                text: `Find: ${scrapedData._groups || ''}\nCreate: ${whatWillCreate.group || ''}`,
                style: fixedWidth
            });
            
            row.append(resultsId, resultsTitle, resultsCode, resultsDate, resultsPerformers, resultsTags, resultsStudio, resultsIndex, resultsGroups);
            resultsContainer.append(row);
            progress.write(`Scraper - Scraping ${i + 1}/${scene.length}`);
            checkScraperData(scene, row);
        };

        dryRun = undefined;
        whatWillCreate = {};
        progress.write('Scraper - Scraping completed');
        sk.tool.notify(pluginName, 'Scraping completed', 'success');
    };

    function prepareScrapeResults(scenes) {
        scrapeResults = {
            total: scenes.length,
            scraped: 0,
            alreadyScraped: 0,
            skipped: 0,
            notJav: 0,
            created: {
                performers: 0,
                studios: 0,
                groups: 0,
                tags: 0
            }
        };
    };

    function canScrape(scene, forceScrape) {
        let canScrape;

        scene.stash_ids.forEach((stashId) => {
            if (!forceScrape && stashId?.endpoint === 'skScraperJAV') scrapeResults.alreadyScraped++;
            if (!forceScrape && stashId?.endpoint !== 'skScraperJAV') scrapeResults.skipped++;
        });

        if ((!scene.stash_ids[0] || forceScrape) && isJAV(scene)) canScrape = true;
        if (!isJAV(scene)) scrapeResults.notJav++
        
        return canScrape;
    };

    function isJAV(scene) {
        const { title = '', code = '' } = scene;

        if (!title.includes('-') && !code.includes('-')) return;

        let [titleCode, titleId] = title.split('-');
        titleId = titleId.split(' ')[0];

        const [sceneCode, sceneId] = code.split('-');

        const isJAVCode = (code, id) => isNaN(code) && !isNaN(id) ? `${code.trim().toUpperCase()}-${id.trim()}` : false;
        return isJAVCode(titleCode, titleId) || isJAVCode(sceneCode, sceneId);
    };

    async function scrapeJAV(scene) {
        const javCode = isJAV(scene);
        const [code, id] = javCode.split('-');

        const javData = await sk.tool.scrape(`https://www.javmost.ws/search/${javCode}/`, { html: true });
        const results = javData.get('.card');
        if (!results) {
            scrapeResults.skipped++;
            return;
        };

        let scrapedData = {};

        const date = new Date();
        const skStashId = [{
            stash_id: javCode,
            endpoint: 'skScraperJAV',
            updated_at: date.toISOString()
        }];
        scrapedData.stash_ids = scene.stash_ids.concat(skStashId);

        scrapedData.id = scene.id;
        scrapedData.cover_image = `https://img3.javmost.ws/images/${javCode}.webp`;
        scrapedData.title = results.get('h2').read();
        scrapedData.code = javCode;
        scrapedData.date = results.get('p').read().replaceAll(' ', '').split('Release')[1].split('Time')[0];

        let toSearch = { group: [code] };

        results.getAll('p a').forEach((info) => {
            if (info.url().includes('/star/')) toSearch.performer ? toSearch.performer.push(info.read()) : toSearch.performer = [info.read()];
            if (info.url().includes('/category/')) toSearch.tag ? toSearch.tag.push(info.read()) : toSearch.tag = [info.read()];
            if (info.url().includes('/director/')) scrapedData.director = info.read();
            if (info.url().includes('/maker/')) toSearch.studio = [info.read()];
        });

        const stashData = await getStashData(toSearch);
        if (stashData?.performer[0]) scrapedData.performer_ids = stashData.performer;
        if (stashData?.tag[0]) scrapedData.tag_ids = stashData.tag;
        if (stashData?.studio[0]) scrapedData.studio_id = stashData.studio[0];
        if (stashData?.group[0]) scrapedData.groups = [{
            group_id: stashData.group[0],
            scene_index: code
        }];

        if (!dryRun) await sk.stash.update.scene(scrapedData);

        scrapeResults.scraped++;
        return scrapedData;
    };

    async function getStashData(scene) {
        const { create, createFilter } = sk.plugin.get(pluginName);
        let findData = {};

        for (const category in scene) {
            findData[category] = [];
            whatWillCreate[category] = '';
            
            for (const name of scene[category]) {
                const exist = await sk.stash.find[category]({
                    filter: { q: name },
                    fields: 'id'
                });
                
                if (!exist && createFilter.includes(category) && dryRun) whatWillCreate[category] += `${name}, `;

                if (!exist && create && createFilter.includes(category) && !dryRun) {
                    exist = await sk.stash.create[category]({ name: name });

                    scrapeResults.created[`${category}s`]++;
                };

                if (exist?.id) findData[category].push(exist.id);
            };
        };

        return findData;
    };

    async function stashIdToName(data) {
        if (data.performer_ids) {
            const performers = await sk.stash.find.performers({
                ids: data.performer_ids.filter(performer => performer),
                fields: 'name'
            });
            data._performers = performers.map(performer => performer.name).join(', ');
        };

        if (data.tag_ids) {
            const tags = await sk.stash.find.tags({
                ids: data.tag_ids.filter(tag => tag),
                fields: 'name'
            });
            data._tags = tags.map(tag => tag.name).join(', ');
        };

        if (data.studio_id) {
            const studio = await sk.stash.find.studio({
                ids: data.studio_id,
                fields: 'name'
            });
            data._studio = studio.name
        };

        if (data.groups) {
            const groups = await sk.stash.find.groups({
                ids: data.groups.filter(group => group.group_id ? group : null).map(group => group.group_id),
                fields: 'name'
            });
            data._groups = groups.map(group => group.name).join(', ');
        };
        return data;
    };

    function checkScraperData(scene, row) {
        if (!selectedScraperData) selectedScraperData = {
            toUpdate: [],
            ids: []
        };

        if (selectedScraperData.ids.includes(scene.id)) {
            const index = selectedScraperData.ids.indexOf(scene.id);
            selectedScraperData.toUpdate.splice(index, 1);
            selectedScraperData.ids.splice(index, 1);
            row.class(['btn-success', 'btn-danger']);
        } else {
            selectedScraperData.toUpdate.push(scene);
            selectedScraperData.ids.push(scene.id);
            row.class(['btn-danger', 'btn-success']);
        };
    };

    async function updateSelectedScrapedData() {
        const progress = sk.tool.get('#skScraper_JAV_Progress');
        progress.write(`Scraper - Updating 0/${selectedScraperData.toUpdate.length} scenes`);

        createMissingData = true;

        for (let i = 0; i < selectedScraperData.toUpdate.length; i++) {
            await scrapeJAV(selectedScraperData.toUpdate[i]);
            progress.write(`Scraper - Updating ${i + 1}/${selectedScraperData.toUpdate.length}`);
        };

        progress.write('Scraper - Updating completed');
    };

    async function scrapeNoGUI(forceScrape, scene) {
        const scenes = [scene] || await sk.stash.find.scenes({ fields: 'id title code stash_ids { endpoint }' });
        prepareScrapeResults(scenes);

        sk.tool.notify(pluginName, `Searching for JAV in ${scenes.length}`);

        for (const scene of scenes) if (canScrape(scene, forceScrape)) await scrapeJAV(scene);

        let created = '';
        for (const category in scrapeResults.created) created += scrapeResults.created[category] ? `${category[0].toUpperCase() + category.slice(0, 1)} - ${scrapeResults.created[category]} ` : '';

        const results = `Total: ${scrapeResults.total}
        Scraped: ${scrapeResults.scraped}
        Already Scraped: ${scrapeResults.alreadyScraped}
        Skipped: ${scrapeResults.skipped}
        Not JAV: ${scrapeResults.notJav}
        Created: ${getCreatedString()}
        `;

        sk.tool.notify(pluginName, results, 'Success');
    };

    // Hooks
    function setHooks() {
        if (sk.plugin.get(pluginName).autoScrape) sk.hook.add(({
            category: 'scene',
            operation: 'update',
            callback: async (scene) => scrapeNoGUI(false, await sk.stash.find.scene({
                fields: 'title code stash_ids { endpoint }',
                ids: [scene.id]
            }))
        }));
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            callback: scraperGUI,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                },
                {
                    version: '2.0',
                    description: 'Added compatibility to skManager.'
                },
                {
                    version: '2.1',
                    description: 'Force update plugin.'
                }
            ]
        });
    };

    function skKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k j g',
                    action: 'Open the scraper GUI',
                    callback: scraperGUI
                },
                {
                    sequence: 'esc',
                    action: 'Close the scraper GUI',
                    callback: () => sk.tool.get('#skScraper_JAV_GUI').remove(),
                    selector: '#skScraper_JAV_GUI'
                }
            ]
        });
    };

    initialize();
})()