(() => {
    const pluginName = 'skUI - Tags';

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                cardRemove: 'description, child, parent',
                popoversRemove: '',
                popoversCount: true
            }
        });
    };

    // Watcher
    function setWatcher() {
        sk.tool.wait(sk.ui.is.tagCard, editCard);
    };

    function editCard() {
        const { cardRemove, popoversRemove, popoversCount } = sk.plugin.get(pluginName);

        sk.ui.get.cards.tag().forEach(card => {
            cardRemove.toLowerCase().split(',').forEach(filter => card._data[filter.trim()] ? card._data[filter.trim()].style({ display: 'none' }) : null);
            popoversRemove.toLowerCase().split(',').forEach(filter => card._data[filter.trim()] ? card._data[filter.trim()].style({ display: 'none' }) : null);

            if (!popoversCount) card._data.popovers.getAll('div').forEach(popover => popover.get('span').style({ display: 'none' }));
        });
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
                    version: '2.0',
                    description: 'Added compatibility to skManager.'
                }
            ]
        });
    };

    initialize();
})();