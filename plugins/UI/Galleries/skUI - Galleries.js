(() => {
    const pluginName = 'skUI - Galleries';

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
        skThemeCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                pageInfo: 'createdAt, updatedAt',
                cardRemove: 'title, studio, date, description',
                cardOrganized: true,
                popoversRemove: 'organized',
                popoversCount: true
            }
        });
    };

    // Watcher
    function setWatcher() {
        sk.tool.wait(sk.ui.is.galleryCard, editCard);
        sk.tool.wait(sk.ui.is.galleryPage, editPage, true);
    };

    function editCard() {
        const { cardRemove, cardOrganized, popoversRemove, popoversCount } = sk.plugin.get(pluginName);

        sk.ui.get.cards.gallery().forEach(card => {
            cardRemove.toLowerCase().split(',').forEach(filter => card._data[filter.trim()] ? card._data[filter.trim()].style({ display: 'none' }) : null);
            popoversRemove.toLowerCase().split(',').forEach(filter => card._data[filter.trim()] ? card._data[filter.trim()].style({ display: 'none' }) : null);

            if (!popoversCount) card._data.popovers.getAll('div').forEach(popover => popover.get('span').style({ display: 'none' }));

            if (cardOrganized && card._data.organized) card.class('skUI_Galleries_Card_Organized');
        });
    };

    function editPage() {
        const { pageInfo } = sk.plugin.get(pluginName);
        const page = sk.ui.get.page.gallery();

        for (const filter of pageInfo.toLowerCase().split(',')) {
            if (page[filter.trim()]) page[filter.trim()].style({ display: 'none' });
            if (!page[filter.trim()]) {
                setTimeout(editPage, 100);
                return;
            };
        };
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                },
                {
                    version: '1.1',
                    description: 'Added compatibility to skUI - Theme.'
                },
                {
                    version: '2.0',
                    description: 'Added compatibility to skManager.'
                }
            ]
        });
    };

    function skThemeCompatibility() {
        if (window._skUI_Theme) window._skUI_Theme.load(pluginName, {
            Card: {
                Organized: { selector: '.skUI_Galleries_Card_Organized' }
            }
        });
    };

    initialize();
})();