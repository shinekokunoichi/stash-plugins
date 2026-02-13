(() => {
    const pluginName = 'skUI - Scenes';
    let settings, scenes;

    function start() {
        const cards = sk.ui.get.sceneCards();
        let cardRemove = settings.cardRemove.toLowerCase();
        if (cardRemove.includes(',')) cardRemove = cardRemove.replaceAll(',');
        let popoversRemove = settings.popoversRemove.toLowerCase();
        if (popoversRemove.includes(',')) popoversRemove.replaceAll(',');
        cards.forEach((card, i) => {
            //Remover
            cardRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            popoversRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            //Filter
            if (settings.cardWatched && current.play_count > 0) card._data.thumbnail.style({ filter: 'brighteness(.5)' });
            if (settings.cardOrganized && card._data.organized) card.style({ border: 'rgba(0,0,0,0) 3px solid' });
            if (!settings.popoversCount) card.popovers.getAll('div').forEach((popover) => { popover.get('span').style({ display: 'none' }); });
        });
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                cardRemove: 'studio resolution duration date description',
                cardWatched: true,
                cardOrganized: true,
                popoversRemove: 'copies organized',
                popoversCount: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.hook.add({ category: 'scene', operation: 'find', callback: (data) => { scenes = data; } });
        sk.tool.wait('.scene-card', start);
    };

    main()
})();