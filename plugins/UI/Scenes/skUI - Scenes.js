(() => {
    const pluginName = 'skUI - Scenes';
    let scenes, videoWrapperStyle;

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Hooks
        setHooks();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
        skKeybinderCompatibility();
        skThemeCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                pageHide: true,
                pageInfo: 'frameRate, resolution, createdAt, updatedAt',
                pageTheatre: 'darken',
                cardRemove: 'studio, resolution, duration, date, description',
                cardWatched: true,
                cardOrganized: true,
                popoversRemove: 'copies, organized, o_counter',
                popoversCount: true
            }
        });
    };

    function setHooks() {
        sk.hook.add({
            category: 'scene',
            operation: 'find',
            callback: (data) => scenes = data.scenes
        })
    };

    // Watcher
    function setWatcher() {
        sk.tool.wait(sk.ui.is.sceneCard, editCard);
        sk.tool.wait(sk.ui.is.scenePage, editPage, true);
    };

    function editCard() {
        const { cardRemove, cardWatched, cardOrganized, popoversRemove, popoversCount } = sk.plugin.get(pluginName);

        sk.ui.get.cards.scene().forEach((card, i) => {
            const scene = scenes[i] || {};

            cardRemove.toLowerCase().split(',').forEach(filter => card._data[filter.trim()] ? card._data[filter.trim()].style({ display: 'none' }) : null);
            popoversRemove.toLowerCase().split(',').forEach(filter => card._data[filter.trim()] ? card._data[filter.trim()].style({ display: 'none' }) : null);

            if (!popoversCount) card._data.popovers.getAll('div').forEach(popover => popover.get('span').style({ display: 'none' }));

            if (cardWatched && scene.play_count > 0) card._data.thumbnail.class('skUI_Scenes_Card_Watched');
            if (cardOrganized && card._data.organized) card.class('skUI_Scenes_Card_Organized');
        });
    };

    function editPage() {
        const { pageInfo, pageHide, pageTheatre } = sk.plugin.get(pluginName);
        const page = sk.ui.get.page.scene();

        for (const filter of pageInfo.toLowerCase().split(',')) {
            if (page[filter.trim()]) page[filter.trim()].style({ display: 'none' });
            if (!page[filter.trim()]) {
                setTimeout(editPage, 100);
                return;
            };
        };

        if (pageHide) sk.tool.get('.scene-divider').child()[0].click();
        if (pageTheatre.toLowerCase() !== 'default') setTheatreMode(pageTheatre.toLowerCase());

        sk.tool.get('video').class('skUI_Scenes_Video');
    };

    function setTheatreMode(mode) {
        if (!videoWrapperStyle) sk.tool.get('.video-wrapper').element.style;

        if (theatre === 'default') {
            if (sk.tool.get('#skUI_Scenes_Theatre')) sk.tool.get('#skUI_Scenes_Theatre').remove();
            sk.tool.get('.video-wrapper').element.style = videoWrapperStyle;
        };

        if (theatre === 'darken') {
            const overlay = sk.ui.make.container({
                id: 'skUI_Scenes_Theatre',
                style: {
                    position: 'fixed',
                    'z-index': 2000,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.75)'
                }
            });

            sk.tool.get('.scene-player-container').style({ 'z-index': 3000 });
            sk.tool.get('.main.container-fluid div.row').append(overlay);
        };

        if (theatre === 'fake fullscreen') sk.tool.get('.video-wrapper').style({
            width: '100%',
            height: '100%',
            position: 'fixed',
            'z-index': 2000,
            'top': 0
        });

        if (theatre === 'fullscreen') sk.tool.get('.vjs-fullscreen-control').click();
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
                Watched: { selector: '.skUI_Scenes_Card_Watched' },
                Organized: { selector: '.skUI_Scenes_Card_Organized' }
            }
        });
    };

    function skKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k s d',
                    action: 'Set theatre mode darken',
                    callback: () => setTheatreMode('darken')
                },
                {
                    sequence: 's k s s',
                    action: 'Set theatre mode fake fullscreen',
                    callback: () => setTheatreMode('fake fullscreen')
                },
                {
                    sequence: 's k s f',
                    action: 'Set theatre mode fullscreen',
                    callback: () => setTheatreMode('fullscreen')
                },
                {
                    sequence: 'esc',
                    action: 'Remove theatre mode',
                    callback: () => setTheatreMode('default'),
                    selector: '.skUI_Scenes_Video'
                }
            ]
        });
    };

    initialize();
})();