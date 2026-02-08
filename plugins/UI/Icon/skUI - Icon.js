(() => {
    const pluginName = 'skUI - Icon';
    let settings;

    function create() {
        const scene = sk.tool.getAll('svg.fa-circle-play').map((svg) => { svg._type = 'Scene'; return svg; });
        const image = sk.tool.getAll('svg.fa-image').map((svg) => { svg._type = 'Image'; return svg; });
        const group = sk.tool.getAll('svg.fa-film').map((svg) => { svg._type = 'Group'; return svg; });
        const marker = sk.tool.getAll('svg.fa-location-dot').map((svg) => { svg._type = 'Marker'; return svg; });
        const gallery = sk.tool.getAll('svg.fa-images').map((svg) => { svg._type = 'Gallery'; return svg; });
        const performer = sk.tool.getAll('svg.fa-user').map((svg) => { svg._type = 'Performer'; return svg; });
        const studio = sk.tool.getAll('svg.fa-video').map((svg) => { svg._type = 'Studio'; return svg; });
        const tag = sk.tool.getAll('svg.fa-tag').map((svg) => { svg._type = 'Tag'; return svg; });

        [].concat(scene, image, group, marker, gallery, performer, studio, tag).forEach((svg) => {
            const icon = settings.iconStyle === 'emoji' ? sk.ui.make.span({ text: settings[`e${svg._type}`], style: { 'font-size': '25px', 'text-shadow': '0, 0 black' } }) : sk.ui.make.image({ url: `/plugin/skUI - Assets/assets/Icon/${svg._type}.png`, style: { width: '35px', height: '35px' } });
            icon.class('skUIIcon');
            svg.element.parentNode.appendChild(icon.element);
            svg.remove();
        });
    };

    function replace() {
        if (settings.navStyle === 'both' && settings.iconStyle === 'default') return;
        if (settings.navStyle === 'text') sk.ui.get.navbar().nav.getAll('svg').forEach((svg) => { svg.remove(); });
        if (settings.navStyle === 'icon') sk.ui.get.navbar().nav.getAll('span').forEach((text) => { if (!text.class().includes('skUIIcon')) text.remove(); });
        if (settings.navStyle !== 'text' && settings.iconStyle !== 'default') create();
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
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
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.tool.wait('svg', replace);
    };

    main();
})()