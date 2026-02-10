(() => {
    const pluginName = 'skUI - Scenes';
    let settings, scenes;

    function start() {
	const cardRemove = settings.cardRemove.toLowerCase();
        const cards = sk.tool.getAll('.scene-card');
        cards.forEach((card, i) => {
            const current = scenes.scenes[i];
            if (!current) return;
            const studio = card.get('.studio-overlay');
            const resolution = card.get('.overlay-resolution');
            const duration = card.get('.overlay-duration');
            const title = card.get('h5');
            const date = card.get('.scene-card__date');
            const description = card.get('.scene-card__description');
            //Remover
            if (cardRemove.includes('studio') && studio) studio.style({ display: 'none' });
            if (cardRemove.includes('resolution') && resolution) resolution.style({ display: 'none' });
            if (cardRemove.includes('duration') && duration) duration.style({ display: 'none' });
            if (cardRemove.includes('title') && title) title.style({ display: 'none' });
            if (cardRemove.includes('date') && date) date.style({ display: 'none' });
            if (cardRemove.includes('description') && description) description.style({ display: 'none' });
            //Filter
            if (settings.cardWatched && current.play_count > 0) card.get('img').style({ filter: 'brighteness(.5)' });
            if (settings.cardOrganized && current.organized) card.style({ border: 'rgba(0,0,0,0) 3px solid' });
        });
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                cardRemove: 'studio resolution duration date description',
                cardWatched: true,
                cardOrganized: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.hook.add({ category: 'scene', operation: 'find', callback: (data) => { scenes = data; } });
        sk.tool.wait('.scene-card', start);
    };

    main()
})();