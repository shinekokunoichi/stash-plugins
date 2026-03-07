(() => {
    const pluginName = 'skUI - Tags';
    let settings;

    function card() {
        const cards = sk.ui.get.cards.tag();
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

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                cardRemove: 'description child parent',
                popoversRemove: '',
                popoversCount: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.tool.wait(sk.ui.is.tagCard, card);
    };

    main()
})();