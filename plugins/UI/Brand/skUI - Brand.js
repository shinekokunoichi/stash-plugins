(() => {
    const pluginName = 'skUI - Brand';

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Favicon
        changeFavicon();

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
                showName: true,
                name: 'SK',
                showBrand: true,
                brandLogo: true
            }
        })
    };

    // Favicon
    function changeFavicon() {
        sk.tool.getAll('link').forEach(link => link.attribute('rel').includes('icon') ? link.url('/plugin/skUI - Assets/assets/Brand/Favicon.png') : null);
    };

    // Watcher
    function setWatcher() {
        sk.tool.wait('.navbar-brand', changeBrand, true);

        const { showName, name } = sk.plugin.get(pluginName);
        const title = sk.tool.get('title');

        new MutationObserver(() => {
            if (title.read().includes('Stash')) showName ? title.write(title.read().replace('Stash', name)) : title.write(title.read().replace('Stash', ''));
        }).observe(title.element, {
            childList: true,
            characterData: true
        });

        title.write(title.read());
    };

    function changeBrand() {
        const { name, showBrand, brandLogo } = sk.plugin.get(pluginName);
        const brand = sk.ui.get.navbar().brand;

        if (!showBrand) brand.remove();
        if (showBrand && !brandLogo) brand.get('button').write(name);
        if (showBrand && brandLogo) {
            if (!brand.get('button')) return;

            const img = sk.ui.make.image({
                class: 'skUI_Brand_Logo',
                url: '/plugin/skUI - Assets/assets/Brand/Brand.png',
                style: { width: '70px' }
            });

            brand.get('button').remove();
            brand.get('a').append(img);
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
            General: {
                Logo: { selector: 'skUI_Brand_Logo' }
            }
        });
    };

    initialize();
})();