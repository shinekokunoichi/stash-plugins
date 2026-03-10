(() => {
    const pluginName = 'skExtra - Most-Used';
    let settings, preload, stats;

    function card(category) {
        if (sk.tool.get('.SKES_C')) return;
        if (settings.cardCrown) {
            const singular = category.substring(0, category.length - 1).trim();
            const cards = sk.ui.get.cards[singular]();
            cards.forEach((card) => {
                [1, 2, 3].forEach((position) => {
                    stats.o_counter[category][position].forEach((entry) => {
                        if (entry.id == card._data.id) card._data.previewSection.append(sk.ui.make.image({ class: 'SKES_C', url: `/plugin/skUI - Assets/assets/Stats/${position}.png`, style: { width: '50px', position: 'absolute', top: 0, left: 0 } }));
                    });
                });
            });
        };
    };

    function page(category) {
        if (sk.tool.get('.SKES_C')) return;
        if (settings.pageCrown) {
            const singular = category.substring(0, category.length - 1).trim();
            [1, 2, 3].forEach((position) => {
                stats.o_counter[category][position].forEach((entry) => {
                    const page = sk.ui.get.page[singular]();
                    if (!page.studio || !page.headers) return;
                    if (entry.id == page.id) {
                        const img = sk.ui.make.image({ class: 'SKES_C', url: `/plugin/skUI - Assets/assets/Stats/${position}.png`, style: { width: '50px', position: 'absolute', top: 0, left: 0 } });
                        page.studio ? page.studio.append(img) : page.headers.append(img);
                    };
                });
            });
        };
    };

    async function buildStats() {
        stats = {};
        statsType = ['o_counter'];
        for (type of statsType) {
            stats[type] = {};
            for (category in preload) {
                stats[type][category] = { 1: [], 2: [], 3: [] };
                for (entry of preload[category]) {
                    let setted = false;
                    for (position in stats[type][category]) {
                        if (entry.o_counter != 0 && !setted) {
                            const current = stats[type][category][position];
                            if (!current[0] || current[0].o_counter == entry.o_counter) {
                                current.push(entry);
                                setted = true;
                            };
                            if (current[0].o_counter < entry.o_counter) {
                                if (position == 1 || position == 2 && stats[type][category]['3'][0]) stats[type][category]['3'] = stats[type][category]['2'];
                                if (position == 1 && stats[type][category]['2'][0]) stats[type][category]['2'] = current;
                                stats[type][category][position] = [entry];
                                setted = true;
                            };
                        };
                    };
                };
            };
        };
        sessionStorage.setItem('skExtra - Stats', JSON.stringify(stats));
    };

    async function preloader() {
        preload = {};
        const categories = settings.statsCrown.includes(',') ? settings.statsCrown.split(',') : settings.statsCrown.split(' ');
        for (category of categories) preload[category] = await sk.stash.find[category]({ fields: 'id o_counter' });
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                statsCrown: 'scenes images groups performers studios',
                cardCrown: true,
                pageCrown: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        await preloader();
        await buildStats();
        if (settings.statsCrown.includes('scenes')) {
            sk.tool.wait(sk.ui.is.sceneCard, () => { card('scenes') });
            sk.tool.wait(sk.ui.is.scenePage, () => { page('scenes') }, true);
        };
        if (settings.statsCrown.includes('images')) {
            sk.tool.wait(sk.ui.is.sceneCard, () => { card('images') });
            sk.tool.wait(sk.ui.is.scenePage, () => { page('images') }, true);
        };
        if (settings.statsCrown.includes('groups')) {
            sk.tool.wait(sk.ui.is.sceneCard, () => { card('groups') });
            sk.tool.wait(sk.ui.is.scenePage, () => { page('groups') }, true);
        };
        if (settings.statsCrown.includes('performers')) {
            sk.tool.wait(sk.ui.is.sceneCard, () => { card('performers') });
            sk.tool.wait(sk.ui.is.scenePage, () => { page('performers') }, true);
        };
        if (settings.statsCrown.includes('studios')) {
            sk.tool.wait(sk.ui.is.sceneCard, () => { card('studios') });
            sk.tool.wait(sk.ui.is.scenePage, () => { page('studios') }, true);
        };
    };

    main();
})()