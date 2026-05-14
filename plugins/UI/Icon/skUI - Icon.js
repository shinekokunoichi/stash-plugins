(() => {
    const pluginName = 'skUI - Icon';

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
                removeDonate: true,
                navStyle: 'icon',
                iconStyle: 'emoji',
                eScene: '🎬',
                eImage: '📷',
                eGroup: '🎞️',
                eMarker: '📍',
                eGallery: '🖼️',
                ePerformer: '👤',
                eStudio: '🎥',
                eTag: '🪧'
            }
        });
    };

    // Watcher
    function setWatcher() {
        if (sk.plugin.get(pluginName).removeDonate) sk.tool.wait('.donate', removeDonateButton, true);
        sk.tool.wait('svg', replaceIcons);
    };

    function removeDonateButton() {
        sk.tool.getAll('.donate').forEach(button => button.style({ display: 'none' }));
    };

    function replaceIcons() {
        let { navStyle, iconStyle } = sk.plugin.get(pluginName);
        navStyle = navStyle.toLowerCase();
        iconStyle = iconStyle.toLowerCase();

        const nav = sk.ui.get.navbar().nav;

        if (navStyle === 'both' && iconStyle === 'default') return;
        if (navStyle === 'icon') nav.getAll('span').forEach(span => !span.class().includes('skUI_Icon') ? span.remove() : null);
        if (navStyle === 'text') nav.getAll('svg').forEach(svg => svg.remove());
        if (navStyle !== 'text' && iconStyle !== 'default') createCustomIcons();
    };

    function createCustomIcons() {
        const settings = sk.plugin.get(pluginName);
        const iconStyle = settings.iconStyle.toLowerCase();

        const scenes = sk.tool.getAll('svg.fa-circle-play');
        const images = sk.tool.getAll('svg.fa-image');
        const groups = sk.tool.getAll('svg.fa-film');
        const markers = sk.tool.getAll('svg.fa-location-dot');
        const galleries = sk.tool.getAll('svg.fa-images');
        const performers = sk.tool.getAll('svg.fa-user');
        const studios = sk.tool.getAll('svg.fa-video');
        const tags = sk.tool.getAll('svg.fa-tag');

        [scenes, images, groups, markers, galleries, performers, studios, tags].forEach(svg => {
            const createEmoji = type => sk.ui.make.span({
                class: 'skUI_Icon_Emoji',
                text: settings[`e${type}`]
            });

            const createImage = type => sk.ui.make.image({
                class: 'skUI_Icon_Image',
                url: `/plugin/skUI - Assets/assets/Icon/${type}.png`
            });

            const iconType = getIconType(svg);
            const icon = iconStyle === 'emoji' ? createEmoji(iconType) : createImage(iconType);

            svg.element.parentNode.appendChild(icon.element);
            svg.remove();
        });
    };

    function getIconType(icon) {
        const className = icon.class();

        if (className.includes('fa-circle-play')) return 'Scene';
        if (className.includes('fa-image')) return 'Image';
        if (className.includes('fa-film')) return 'Group';
        if (className.includes('fa-location-dot')) return 'Marker';
        if (className.includes('fa-images')) return 'Gallery';
        if (className.includes('fa-user')) return 'Performer';
        if (className.includes('fa-video')) return 'Studio';
        if (className.includes('fa-tag')) return 'Tag';
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
            Global: {
                Emoji: { selector: '.skUI_Icon_Emoji' },
                Image: { selector: '.skUI_Icon_Image' }
            }
        });
    };

    initialize();
})()