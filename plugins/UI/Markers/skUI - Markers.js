(() => {
    const pluginName = 'skUI - Markers';
    let settings;

    function card() {
        const cards = sk.ui.get.cards.marker();
        let cardRemove = settings.cardRemove.toLowerCase();
        if (cardRemove.includes(',')) cardRemove = cardRemove.replaceAll(',', ' ');
        let popoversRemove = settings.popoversRemove.toLowerCase();
        if (popoversRemove.includes(',')) popoversRemove = popoversRemove.replaceAll(',', ' ');
        cards.forEach((card) => {
            //Remover
            cardRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            popoversRemove.split(' ').forEach((filter) => { if (card._data[filter]) card._data[filter].style({ display: 'none' }); });
            //Filter
            if (!settings.popoversCount) card._data.popovers.getAll('div').forEach((popover) => { popover.get('span').style({ display: 'none' }); });
        });
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                cardRemove: 'time scene',
                popoversRemove: '',
                popoversCount: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.tool.wait(sk.ui.is.markerCard, card);
    };

    main()
})();