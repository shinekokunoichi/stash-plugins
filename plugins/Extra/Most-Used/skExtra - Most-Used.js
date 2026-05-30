(() => {
    const pluginName = 'skExtra - Most-Used';
    let preloadedData, statsInfo;

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Crown stats
        await preloadStats();
        await buildStats();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
        skKeybinderCompatibility();
        skThemeCompatibility();
    };

    // Settings
    async function setDefaultSettings(){
        await sk.plugin.check({
            name: pluginName,
            options: {
                statsCrown: 'scenes, images, groups, performers, studios',
                cardCrown: true,
                pageCrown: true,
                rankStyle: 'global:1:gold-shine, global:2:silver-move, global:3:bronze'
            }
        });
    }

    // Crown stats
    async function preloadStats() {
        preloadedData = {};
        const { statsCrown } = sk.plugin.get(pluginName);
        let categories = statsCrown.includes(',') ? statsCrown.split(',') : statsCrown.split(' ');
        categories = categories.map(category => category.trim());
        for (category of categories) preloadedData[category] = await sk.stash.find[category]({ fields: 'id o_counter' });
    };

    async function buildStats() {
        statsInfo = {};

        // Preloaded category
        for (category in preloadedData) {
            statsInfo[category] = {
                1: [],
                2: [],
                3: []
            };

            // Entry of preloaded category
            for (entry of preloadedData[category]) {
                let ranked;

                // Rank of preloaded category
                for (rank in statsInfo[category]) {
                    const current = statsInfo[category][rank];
                    if (entry.o_counter != 0 && !ranked) {
                        if (!current[0] || current[0].o_counter == entry.o_counter) {
                            current.push(entry);
                            ranked = true;
                        };

                        if (current[0].o_counter < entry.o_counter) {
                            if (rank == 1 || rank == 2) statsInfo[category]['3'] = statsInfo[category]['2'];
                            if (rank == 1) statsInfo[category]['2'] = current;
                            statsInfo[category][rank] = [entry];
                            ranked = true;
                        };
                    };
                };
            };
        };
    };

    // Watcher
    function setWatcher() {
        const { statsCrown, cardCrown, pageCrown } = sk.plugin.get(pluginName);
        const categories = statsCrown.includes(',') ? statsCrown.split(',') : statsCrown.split(' ');

        categories.forEach((category) => {
            category = category.trim().slice(0, -1); 
            if (cardCrown) sk.tool.wait(sk.ui.is[`${category}Card`], () => setRankStyle(category, 'card'));
            if (pageCrown) sk.tool.wait(sk.ui.is[`${category}Page`], () => setRankStyle(category, 'page'));
        });
    };

    function setRankStyle(category, where) {
        if (sk.tool.get('.skExtra_Most_Used_Crown')) return;
        if (!sk.plugin.get(pluginName)[`${where}Crown`]) return;

        const elements = where === 'card' ? sk.ui.get.cards[category]() : [sk.ui.get.page[category]()];

        elements.forEach((element) => {
            [1, 2, 3].forEach((rank) => {
                statsInfo[`${category}s`][rank].forEach((entry) => {
                    if (entry.id === element?._data?.id || entry.id === element.id) {
                        const crown = sk.ui.make.image({
                            class: 'skExtra_Most_Used_Crown',
                            url: `/plugin/skUI - Assets/assets/Stats/${rank}.png`
                        });

                        element.class ? element.class(`skExtra_Most_Used_Rank${rank}`) : element.info.class(`skExtra_Most_Used_Rank${rank}`);
                        where === 'card' ? element._data.previewSection.append(crown) : element.header.append(crown);

                        sk.plugin.get(pluginName).rankStyle.split(',').forEach((style) => {
                            let [styleCategory, styleRank, styleSelector] = style.split(':');
                            styleCategory = styleCategory.trim().toLowerCase();
                            if ((styleCategory === category.toLowerCase() || styleCategory === 'global') && styleRank == rank) where === 'card' ? element.class(styleSelector) : element.info.class(styleSelector);
                        });
                    };
                });
            });
        });
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            callback: statsGUI,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                },
                {
                    version: '1.1',
                    description: 'Added compatibility to skUI - Theme'
                },
                {
                    version: '2.0',
                    description: 'Added compatibility to skManager'
                }
            ]
        });
    };

    function statsGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skExtra_Most_Used_GUI',
            class: 'bg-dark',
            style: {
                width: '100%',
                height: '100%',
                top: 0,
                right: 0,
                'box-shadow': '0 0 5px black',
                'overflow-y': 'auto'
            }
        });
        const howTo = sk.ui.make.title({ text: 'Click the desired style to set it' });
        gui.append(howTo);

        for (const category of ['Global', 'Scenes', 'Images', 'Groups', 'Performers', 'Studios']) {
            const section = sk.ui.make.container();
            const title = sk.ui.make.title({ text: category[0].toUpperCase() + category.slice(1) });
            const rankSection = sk.ui.make.container({ flex: true });
            section.append(title, rankSection);
            gui.append(section);

            for (const rank of [1, 2, 3]) {
                const card = sk.ui.make.container({
                    class: 'card',
                    flex: true,
                    style: {
                        padding: 0,
                        'flex-direction': 'column'
                    }
                });
                const crown = sk.ui.make.image({
                    url: `/plugin/skUI - Assets/assets/Stats/${rank}.png`,
                    style: { width: '5rem' }
                });
                const styleButtons = getStyleButtons(card, category, rank);

                card.append(crown, styleButtons);
                rankSection.append(card);
            };
        };

        const close = sk.ui.make.button({
            text: 'Close',
            class: 'btn btn-danger',
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        });

        gui.append(close);

        document.body.append(gui.element);
    };

    function getStyleButtons(card, category, rank) {
        const section = sk.ui.make.container({
            flex: true,
            style: { 'flex-direction': 'column' }
        });

        const staticSection = sk.ui.make.container({
            flex: true,
            style: { 'flex-direction': 'column' }
        });
        const staticTitle = sk.ui.make.subTitle({ text: 'Static' });
        const staticButtons = sk.ui.make.container({
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });
        staticSection.append(staticTitle, staticButtons);

        const animationSection = sk.ui.make.container({
            flex: true,
            style: { 'flex-direction': 'column' }
        });
        const animationTitle = sk.ui.make.subTitle({ text: 'Animation' });
        const animationButtons = sk.ui.make.container({
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });
        animationSection.append(animationTitle, animationButtons);

        section.append(staticSection, animationSection);

        const staticStyle = ['', 'shine', 'sea', 'ruby', 'emerald', 'gold', 'silver', 'bronze'];
        const animationType = ['move', 'shine']

        for (const style of staticStyle) {
            staticButtons.append(sk.ui.make.container({
                class: style ? `card ${style}` : 'card',
                style: { cursor: 'pointer' },
                event: {
                    type: 'click',
                    callback: () => saveSelectedStyle(card, category, rank, style)
                }
            }));

            if (style !== 'shine' && style) animationType.forEach(type => animationButtons.append(sk.ui.make.container({
                class: `card ${style}-${type}`,
                style: { cursor: 'pointer' },
                event: {
                    type: 'click',
                    callback: () => saveSelectedStyle(card, category, rank, `${style}-${type}`)
                }
            })));
        };

        return section;
    };

    function saveSelectedStyle(card, category, rank, selector) {
        selector ? card.class(`card ${selector}`, true) : card.class('card', true);
        const { rankStyle } = sk.plugin.get(pluginName);

        let toEdit;
        rankStyle.split(',').forEach((style) => {
            const [styleCategory, styleRank, styleSelector] = style.split(':');
            if (styleCategory.trim().toLowerCase() === category.toLowerCase() && styleRank == rank) toEdit = style;
        });

        if (!selector) {
            toEdit = rankStyle.replace(toEdit, '');
            if (toEdit.includes(',,')) toEdit = toEdit.replace(',,', ',');

            sk.plugin.update({
                name: pluginName,
                options: { rankStyle: toEdit }
            });
        };

        if (selector && toEdit) sk.plugin.update({
            name: pluginName,
            options: { rankStyle: rankStyle.replace(toEdit, `${category.toLowerCase()}:${rank}:${selector}`) }
        });

        if (selector && !toEdit) sk.plugin.update({
            name: pluginName,
            options: {
                rankStyle: rankStyle[rankStyle.length] === ',' ? `${rankStyle} ${category.toLowerCase()}:${rank}:${selector}` : `${rankStyle}, ${category.toLowerCase()}:${rank}:${selector}`
            }
        });
    };

    function skKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k m u g',
                    action: 'Open the stats GUI',
                    callback: statsGUI
                },
                {
                    sequence: 'esc',
                    action: 'Close the metadata parser',
                    callback: () => sk.tool.get('#skExtra_Most_Used_GUI').remove(),
                    selector: '#skExtra_Most_Used_GUI'
                }
            ]
        });
    };

    function skThemeCompatibility() {
        if (window._skUI_Theme) window._skUI_Theme.load(pluginName, {
            General: {
                Crown: { selector: '.skExtra_Most_Used_Crown' },
                'Rank 1': { selector: '.skExtra_Most_Used_Rank1' },
                'Rank 2': { selector: '.skExtra_Most_Used_Rank2' },
                'Rank 3': { selector: '.skExtra_Most_Used_Rank3' }
            }
        });
    };

    initialize();
})();