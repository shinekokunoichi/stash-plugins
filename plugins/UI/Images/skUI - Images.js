(() => {
    const pluginName = 'skUI - Images';
    let settings;

    function card() {
        const cards = sk.ui.get.cards.image();
        let cardRemove = settings.cardRemove.toLowerCase();
        if (cardRemove.includes(',')) cardRemove = cardRemove.replaceAll(',', ' ');
        let popoversRemove = settings.popoversRemove.toLowerCase();
        if (popoversRemove.includes(',')) popoversRemove = popoversRemove.replaceAll(',', ' ');
        cards.forEach((card) => {
            //Remover
            cardRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            popoversRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            //Filter
            if (settings.cardOrganized && card._data.organized) card.style({ border: 'rgba(0,0,0,0) 3px solid' });
            if (!settings.popoversCount) card._data.popovers.getAll('div').forEach((popover) => { popover.get('span').style({ display: 'none' }); });
        });
    };

    function page() {
        //Info remover
        let pageInfo = settings.pageInfo;
        if (pageInfo.includes(',')) pageInfo = pageInfo.replaceAll(',', ' ');
        const scenePage = sk.ui.get.page.image();
        let loaded = true;
        pageInfo.split(' ').forEach((filter) => {
            if (scenePage[filter]) scenePage[filter].style({ display: 'none' });
            if (!scenePage[filter]) loaded = false;
        });
        if (!loaded) {
            setTimeout(page, 200);
            return;
        };
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                pageInfo: 'resolution createdAt updatedAt',
                cardRemove: 'studio resolution date description',
                cardOrganized: true,
                popoversRemove: 'copies organized o_counter',
                popoversCount: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.tool.wait(sk.ui.is.imageCard, card);
        sk.tool.wait(sk.ui.is.imagePage, page,);
    };

    main()
})();