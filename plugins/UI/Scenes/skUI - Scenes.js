(() => {
    const pluginName = 'skUI - Scenes';
    let settings, scenes;

    function card() {
        const cards = sk.ui.get.cards.scene();
        let cardRemove = settings.cardRemove.toLowerCase();
        if (cardRemove.includes(',')) cardRemove = cardRemove.replaceAll(',', ' ');
        let popoversRemove = settings.popoversRemove.toLowerCase();
        if (popoversRemove.includes(',')) popoversRemove = popoversRemove.replaceAll(',', ' ');
        cards.forEach((card, i) => {
            const current = scenes[i];
            if (!current) return;
            //Remover
            cardRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            popoversRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            //Filter
            if (settings.cardWatched && current.play_count > 0) card._data.thumbnail.style({ filter: 'brighteness(.5)' });
            if (settings.cardOrganized && card._data.organized) card.style({ border: 'rgba(0,0,0,0) 3px solid' });
            if (!settings.popoversCount) card._data.popovers.getAll('div').forEach((popover) => { popover.get('span').style({ display: 'none' }); });
        });
    };

    function page() {
        //Info remover
        let pageInfo = settings.pageInfo;
        if (pageInfo.includes(',')) pageInfo = pageInfo.replaceAll(',', ' ');
        const scenePage = sk.ui.get.page.scene();
        let loaded = true;
        pageInfo.split(' ').forEach((filter) => {
            if (scenePage[filter]) scenePage[filter].style({ display: 'none' });
            if (!scenePage[filter]) loaded = false;
        });
        if (!loaded) {
            setTimeout(page, 200);
            return;
        };
        //Theatre mode
        const theatre = settings.pageTheatre.toLowerCase().trim();
        if (settings.pageHide) sk.tool.get('.scene-divider').child()[0].click();
        if (theatre !== 'default') {
            if (theatre === 'darken') {
                const overlay = sk.ui.make.container({ style: { position: 'fixed', 'z-index': 2000, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)' } });
                sk.tool.get('.scene-player-container').style({ 'z-index': 3000 });
                sk.tool.get('.main.container-fluid div.row').append(overlay);
            };
            if (theatre === 'fake fullscreen') sk.tool.get('.video-wrapper').style({ width: '100%', height: '100%', position: 'fixed', 'z-index': 2000, 'top': 0 });
            if (theatre === 'fullscreen') sk.tool.get('.vjs-fullscreen-control').click();
        };
    }

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                pageHide: true,
                pageInfo: 'frameRate resolution createdAt updatedAt',
                pageTheatre: 'darken',
                cardRemove: 'studio resolution duration date description',
                cardWatched: true,
                cardOrganized: true,
                popoversRemove: 'copies organized o_counter',
                popoversCount: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.hook.add({ category: 'scene', operation: 'find', callback: (data) => { scenes = data.scenes; } });
        sk.tool.wait(sk.ui.is.sceneCard, card);
        sk.tool.wait(sk.ui.is.scenePage, page, true);
    };

    main()
})();