(() => {
    let settings;
    const pluginName = 'skUI - Brand';

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                name: 'SK',
                showBrand: true,
                brandLogo: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        //Icon
        sk.tool.getAll('link').forEach((link) => { if (link.attribute('rel').includes('icon')) link.url('/plugin/skUI - Assets/assets/Core/Favicon.png') });
        //Tabs
        const title = sk.tool.get('title');
        new MutationObserver(() => {
            if (title.read().includes('Stash')) title.write(title.read().replace('Stash', settings.name));
        }).observe(title.element, { childList: true, characterData: true });
        title.write(title.read());
        //Brand
        const brand = sk.ui.get.navbar().brand;
        if (!settings.showBrand) brand.remove();
        if (settings.showBrand && !settings.brandLogo) brand.get('button').write(options.name);
        if (settings.showBrand && settings.brandLogo) {
            const img = sk.ui.make.image({ url: '/plugin/skUI - Assets/assets/Core/Brand.png', style: { width: '70px' } });
            brand.get('button').remove();
            brand.get('a').append(img);
        };
    };

    main();
})();