(() => {
    const pluginName = 'skScraper - StashDB';
    let scrapeResults, selectedScraperData;

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
    async function setDefaultSettings(){
        sk.plugin.check({
            name: pluginName,
            options: {
                create: false,
                createFilter: 'performers, studios, tags',
                autoScrape: true,
                autoScrapeFilter: 'performers, studios, tags'
            }
        })
    }

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
                name: 'Scrape All',
                description: 'Scrape all scenes, performers, studios, tags (without any StashID)',
                callback: async () => {
                    await scrapeNoGUI('scenes');
                    await scrapeNoGUI('performers');
                    await scrapeNoGUI('studios');
                    await scrapeNoGUI('tags');
                }
            },
            {
                id: pluginName,
                name: 'Force scrape All',
                description: 'Scrape all scenes, performers, studios, tags (forced)',
                callback: async () => {
                    await scrapeNoGUI('scenes', true);
                    await scrapeNoGUI('performers', true);
                    await scrapeNoGUI('studios', true);
                    await scrapeNoGUI('tags', true);
                }
            },
            {
                id: pluginName,
                name: 'Scrape scenes',
                description: 'Scrape all scenes (without any StashID',
                callback: () => scrapeNoGUI('scenes')
            },
            {
                id: pluginName,
                name: 'Force scrape scenes',
                description: 'Scrape all scenes (forced)',
                callback: () => scrapeNoGUI('scenes', true)
            },
            {
                id: pluginName,
                name: 'Scrape performers',
                description: 'Scrape all performers (without any StashID',
                callback: () => scrapeNoGUI('performers')
            },
            {
                id: pluginName,
                name: 'Force scrape performers',
                description: 'Scrape all performers (forced)',
                callback: () => scrapeNoGUI('performers', true)
            },
            {
                id: pluginName,
                name: 'Scrape studios',
                description: 'Scrape all studios (without any StashID',
                callback: () => scrapeNoGUI('studios')
            },
            {
                id: pluginName,
                name: 'Force scrape studios',
                description: 'Scrape all studios (forced)',
                callback: () => scrapeNoGUI('studios', true)
            },
            {
                id: pluginName,
                name: 'Scrape tags',
                description: 'Scrape all tags (without any StashID',
                callback: () => scrapeNoGUI('tags')
            },
            {
                id: pluginName,
                name: 'Force scrape tags',
                description: 'Scrape all tags (forced)',
                callback: () => scrapeNoGUI('tags', true)
            }
        )
    };

    async function scraperGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skScraper_StashDB_GUI',
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
            id: 'skScraper_StashDB_Progress',
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
                callback: () => searchScraperData('scenes')
            }
        });
        const alsoEndpointScene = sk.ui.make.button({
            text: 'Scenes - all',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData('scenes', true)
            }
        });
        const noEndpointPerformer = sk.ui.make.button({
            text: 'Performers - no endpoint',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData('performers')
            }
        });
        const alsoEndpointPerformer = sk.ui.make.button({
            text: 'Performers - all',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData('performers', true)
            }
        });
        const noEndpointStudio = sk.ui.make.button({
            text: 'Studios - no endpoint',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData('studios')
            }
        });
        const alsoEndpointStudio = sk.ui.make.button({
            text: 'Studio - all',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData('studios', true)
            }
        });
        const noEndpointTag = sk.ui.make.button({
            text: 'Tags - no endpoint',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData('tags')
            }
        });
        const alsoEndpointTag = sk.ui.make.button({
            text: 'Tags - all',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchScraperData('tags', true)
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
                callback: () => sk.tool.getAll('.skScraper_StashDB_ResultsCard').forEach(entry => entry.click())
            }
        });
        searchContainer.append(noEndpointScene, alsoEndpointScene, noEndpointPerformer, alsoEndpointPerformer, noEndpointStudio, alsoEndpointStudio, noEndpointTag, alsoEndpointTag, updateScraped, selectAllScraped);


        const resultsContainer = sk.ui.make.container({
            id: 'skScraper_StashDB_Results',
            flex: true,
            style: {
                width: '100%',
                'margin-top': '1rem',
                'flex-wrap': 'wrap',
                'align-items': 'flex-start'
            }
        });

        card.append(searchContainer, resultsContainer);

        scraperContainer.append(title, card);
        return scraperContainer;
    };

    async function searchScraperData(category, forceScrape) {
        const progress = sk.tool.get('#skScraper_StashDB_Progress');
        const resultsContainer = sk.tool.get('#skScraper_StashDB_Results');
        resultsContainer.write('', true);

        progress.write('Scraper - Loading...');

        const fields = category === 'scenes' || category === 'images' ? 'id title stash_ids { endpoint }' : 'id name stash_ids { endpoint }'
        let data = await sk.stash.find[category]({ fields: fields });

        prepareScrapeResults(data);
        data = data.filter(entry => canScrape(entry, forceScrape));

        progress.write(`Scraper - Scraping 0/${data.length} ${category}`);
        sk.tool.notify(pluginName, `Scraping ${data.length} ${category}`);

        const { genderFilter } = sk.plugin.get(pluginName);

        const createInfo = (key, info) => sk.ui.make.description({ text: `${key[0].toUpperCase() + key.slice(1).replace('_', ' ')}: ${info}` });
        const stashDBLink = id => sk.ui.make.link({
            text: `StashDB ID`,
            url: `https://stashdb.org/${category}/${id.stash_id}`,
            attribute: { target: '_blank' }
        });

        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            let scrapedData = await sk.stashDB.find[`${category.slice(0, -1)}`](entry.title || entry.name);

            if (scrapedData) {
                scrapedData.id = entry.id;
                const card = sk.ui.make.container({
                    class: 'btn-danger skExtra_Metadata_Parser_ResultsCard',
                    flex: true,
                    style: {
                        width: '32rem',
                        padding: '1rem',
                        'min-height': '40rem',
                        'flex-direction': 'row',
                        'justify-content': 'space-between',
                        'aling-items': 'flex-start'
                    },
                    event: {
                        type: 'click',
                        callback: () => checkScraperData(scrapedData, card)
                    }
                });

                const infosContainer = sk.ui.make.container({
                    style: {
                        width: '20rem',
                        'min-height': '40rem',
                        'text-align': 'left'
                    }
                });
                const infos = sk.ui.make.container();

                const imageContainer = sk.ui.make.container({
                    style: {
                        width: '20rem',
                        'min-height': '40rem',
                        'background-size': 'contain',
                        'background-repeat': 'no-repeat',
                        'background-position': 'top center'
                    }
                });

                infosContainer.append(infos);
                card.append(infosContainer, imageContainer);

                infos.append(sk.ui.make.link({
                    text: `Scraped from ${entry.title || entry.name}`,
                    url: `${window.location.origin}/${category}/${entry.id}`,
                    attribute: { target: '_blank' }
                }));

                const stashData = await sk.stashDB.toStash(scrapedData);
                for (const key in stashData) {
                    const value = typeof stashData[key] === 'number' ? String(stashData[key]) : stashData[key];

                    if (value.includes('stashdb')) imageContainer.style({ 'background-image': `url(${value})` })
                    else if (key !== 'stash_ids' && key !== 'urls' && Array.isArray(value)) infos.append(createInfo(key, value.join(', ')))
                    else if (key !== 'stash_ids' && key !== 'urls') infos.append(createInfo(key, value));
                };

                infos.append(stashDBLink(stashData.stash_ids[0]));
                resultsContainer.append(card);
                progress.write(`Scraper - Scraping ${i + 1}/${data.length} ${category}`);
                checkScraperData(scrapedData, card, category);
            };
        };

        dryRun = undefined;
        whatWillCreate = {};
        progress.write('Scraper - Scraping completed');
        sk.tool.notify(pluginName, 'Scraping completed', 'success');
    };

    function prepareScrapeResults(data) {
        scrapeResults = {
            total: data.length,
            scraped: 0,
            alreadyScraped: 0,
            skipped: 0
        };
    };

    function canScrape(entry, forceScrape) {
        let canScrape;
        
        entry.stash_ids.forEach((stashId) => {
            if (!forceScrape && stashId?.endpoint === 'https://stashdb.org/graphql') scrapeResults.alreadyScraped++;
            if (!forceScrape && stashId?.endpoint !== 'https://stashdb.org/graphql') scrapeResults.skipped++;
        });

        if (!entry.stash_ids[0] || forceScrape) canScrape = true;

        return canScrape;
    };

    function checkScraperData(entry, card, category) {
        if (!selectedScraperData) selectedScraperData = {
            toUpdate: [],
            ids: [],
            _category: category.toLowerCase()
        };

        if (selectedScraperData.ids.includes(entry.id)) {
            const index = selectedScraperData.ids.indexOf(entry.id);
            selectedScraperData.toUpdate.splice(index, 1);
            selectedScraperData.ids.splice(index, 1);
            card.class(['btn-success', 'btn-danger']);
        } else {
            selectedScraperData.toUpdate.push(entry);
            selectedScraperData.ids.push(entry.id);
            card.class(['btn-danger', 'btn-success']);
        };
    };

    async function updateSelectedScrapedData() {
        const progress = sk.tool.get('#skScraper_StashDB_Progress');
        progress.write(`Scraper - Updating 0/${selectedScraperData.toUpdate.length} ${selectedScraperData._category}`);

        createMissingData = true;

        for (let i = 0; i < selectedScraperData.toUpdate.length; i++) {
            const { create, createFilter } = sk.plugin.get(pluginName);

            const entry = selectedScraperData.toUpdate[i];
            await sk.stashDB.toStash(entry, {
                update: entry.id,
                create: create && createFilter.includes(selectedScraperData._category)
            });
            progress.write(`Scraper - Updating ${i + 1}/${selectedScraperData.toUpdate.length} ${selectedScraperData._category}`);
        };

        progress.write('Scraper - Updating completed');
    };

    async function scrapeNoGUI(category, forceScrape) {
        const fields = category === 'scenes' || category === 'images' ? 'id title stash_ids { endpoint }' : 'id name stash_ids { endpoint }'
        let data = await sk.stash.find[category]({ fields: fields });

        prepareScrapeResults(data);
        data = data.filter(entry => canScrape(entry, forceScrape));

        sk.tool.notify(pluginName, `Searching for ${data.length} ${category} in StashDB`);

        const { create, createFilter } = sk.plugin.get(pluginName);

        for (const entry of data) {
            const scrapedData = await sk.stashDB.find[`${category.slice(0, -1)}`](entry.title || entry.name);
            if (scrapedData) {
                scrapeResults.scraped++;
                await sk.stashDB.toStash(scrapedData, {
                    update: entry.id,
                    create: create && createFilter.includes(category)
                });
            };
        };

        const results = `Total: ${scrapeResults.total}
        Scraped: ${scrapeResults.scraped}
        Already Scraped: ${scrapeResults.alreadyScraped}
        Skipped: ${scrapeResults.skipped}
        `;

        sk.tool.notify(pluginName, results, 'Success');
    };

    // Hooks
    function setHooks() {
        const { autoScrape, autoScrapeFilter } = sk.plugin.get(pluginName);

        if (autoScrape) autoScrapeFilter.split(',').forEach(category => sk.hook.add({
            category: category,
            operation: 'update',
            callback: () => scrapeNoGUI(category)
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
                    sequence: 's k s g',
                    action: 'Open the scraper GUI',
                    callback: scraperGUI
                },
                {
                    sequence: 'esc',
                    action: 'Close the scraper GUI',
                    callback: () => sk.tool.get('#skScraper_StashDB_GUI').remove(),
                    selector: '#skScraper_StashDB_GUI'
                }
            ]
        });
    };

    initialize();
})()