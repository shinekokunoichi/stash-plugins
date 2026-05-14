(() => {
    const pluginName = 'skUI - Rating';
    let newColors = {};

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
        skKeybinderCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                card: true,
                page: true,
                banner: false,
                changeBanner: false,
                transition: true,
                rating1: 'black',
                rating2: 'darkgreen',
                rating3: 'steelblue',
                rating4: 'rebeccapurple',
                rating5: 'darkorange'
            }
        })
    };

    // Watcher
    function setWatcher() {
        const { page } = sk.plugin.get(pluginName);
        const categories = ['scene', 'image', 'group', 'gallery', 'performer', 'studio', 'tag'];

        sk.tool.wait('.rating-banner', setCardStyle);
        if (page) categories.forEach(category => sk.tool.wait(sk.ui.is[`${category}Page`], () => setPageStyle(category)));
    };

    function setCardStyle() {
        const { banner, changeBanner } = sk.plugin.get(pluginName);

        if (!banner) sk.tool.getAll('.rating-banner').forEach(el => el.style({ display: 'none' }));

        if (isFullRating()) {
            [1, 2, 3, 4, 5].forEach(star => {
                const cards = sk.tool.getAll(`.card:has(.rating-${star})`);
                if (cards[0]) cards.forEach(card => fullRatingStyle(card, star));
            });
        };

        if (!isFullRating()) halfRatingStyle();
    };

    function isFullRating() {
        const { type, starPrecision } = sk.stash.configuration().ui.ratingSystemOptions;
        if (type === 'stars' && starPrecision === 'full') return true;
        if (type === 'decimal' || starPrecision !== 'full') return false;
    };

    function fullRatingStyle(element, star) {
        const settings = sk.plugin.get(pluginName);

        const color = getRGB(settings[`rating${star}`]);
        element.style({ 'background-color': color }, true);
    };

    function getRGB(color, alpha = 1) {
        if (color.includes('rgb') && !alpha) return color;

        if (color.includes('rgb') && alpha) {
            const [r, g, b] = color.replace('rgba(', '').replace('rgb(', '').replace(')', '').split(',');
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const [_, r, g, b] = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
    };

    function halfRatingStyle(page) {
        const settings = sk.plugin.get(pluginName);
        const decimalRating = {
            1: [1, 2, 3, 4],
            2: [5, 6, 7, 8],
            3: [9, 10, 11, 12],
            4: [13, 14, 15, 16],
            5: [17, 18, 19, 20]
        };

        for (const star in decimalRating) {
            const rating = decimalRating[star];
            const modifiers = [0.25, 0.5, 0.75, 1];

            const min = star > 2 ? getRGB(settings[`rating${star - 1}`]) : getRGB(settings.rating1);
            const max = getRGB(settings[`rating${star}`]);

            if (page) {
                const i = rating.indexOf(page.rating.read());
                const color = settings.transition && (min.includes('rgb') && max.includes('rgb')) ? getTransitionColor(modifiers[i], min, max, 0.25) : max;
                page.info.style({ 'background-color': color }, true);
            };

            if (!page) {
                rating.forEach((value, i) => {
                    const color = settings.transition && (min.includes('rgb') && max.includes('rgb')) ? getTransitionColor(modifiers[i], min, max, 0.25) : max;

                    const cards = sk.tool.getAll(`.card:has(.rating-100-${value})`);
                    if (cards[0]) cards.forEach(card => {
                        if (settings.card) card.style({ 'background-color': color }, true);
                        if (settings.banner && settings.changeBanner) card.ratingBanner.style({ 'background-color': color }, true);
                        if (!settings.banner) card.ratingBanner.style({ display: 'none' });
                    });
                });
            };
        };
    };

    function getTransitionColor(modifier, min, max, alpha = 1) {
        min = min.replace('rgba(', '').replace('rgb(').replace(')', '');
        min = min.includes(',') ? min.split(',') : min.split(' ');

        max = max.replace('rgba(', '').replace('rgb(').replace(')', '');
        max = max.includes(',') ? max.split(',') : max.split(' ');

        const r = Number(min[0]) + Number(max[0]) - (Number(min[0]) * modifier);
        const g = Number(min[1]) + Number(max[1]) - (Number(min[1]) * modifier);
        const b = Number(min[2]) + Number(max[2]) - (Number(min[2]) * modifier);

        return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgba(${r}, ${g}, ${b})`;
    };

    function setPageStyle(category) {
        const page = sk.ui.get.page[category]();
        const rating = page.rating.read();

        if (!rating) return;

        if (isFullRating()) fullRatingStyle(page.info, rating);
        if (!isFullRating()) halfRatingStyle(page);
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            callback: styleGUI,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                },
                {
                    version: '2.0',
                    description: 'Added transition for decimal.'
                },
                {
                    version: '3.0',
                    description: 'Added compatibility to skManager.'
                }
            ]
        });
    };

    function styleGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skUI_Rating_GUI',
            class: 'bg-dark',
            style: {
                width: '100%',
                height: '100%',
                top: 0,
                right: 0,
                'box-shadow': '0 0 5px black',
                'overflow-y': 'auto'
            }
        });
        const howTo = sk.ui.make.title({ text: 'Click a card to change the color' });
        gui.append(howTo);

        gui.append(changeRatingSection(), transitionSection());

        const save = sk.ui.make.button({
            text: 'Save',
            class: 'btn btn-success',
            event: {
                type: 'click',
                callback: saveNewColors
            }
        });
        const close = sk.ui.make.button({
            text: 'Close',
            class: 'btn btn-danger',
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        });

        gui.append(save, close);

        document.body.append(gui.element);
    };

    function changeRatingSection() {
        const settings = sk.plugin.get(pluginName);

        const section = sk.ui.make.container({ flex: true });

        for (const star of [1, 2, 3, 4, 5]) {
            const color = getRGB(settings[`rating${star}`]);

            const card = sk.ui.make.container({
                id: `skUI_Rating_Star${star}`,
                class: 'card',
                style: {
                    cursor: 'pointer',
                    'background-color': color
                },
                event: {
                    type: 'click',
                    callback: () => changeRatingColor(card)
                }
            });
            const subTitle = sk.ui.make.subTitle({ text: `Rating ${star}` });

            card.append(subTitle);
            section.append(card);
        };

        return section;
    };

    function changeRatingColor(card) {
        const colorPicker = sk.ui.make.input({
            attribute: { type: 'color' },
            event: [
                {
                    type: 'input',
                    callback: () => card.style({ 'background-color': colorPicker.value() })
                },
                {
                    type: 'change',
                    callback: () => {
                        const gui = sk.tool.get('#skUI_Rating_GUI');
                        const updatedSection = transitionSection(card.id().split('skUI_Rating_Star')[1], colorPicker.value());
                        gui.element.replaceChild(updatedSection.element, gui.element.childNodes[2]);
                    }
                }
            ]
        });
        colorPicker.click();
    };

    function transitionSection(forceStar, forceColor) {
        let settings = sk.plugin.get(pluginName);

        if (forceStar) {
            newColors[`rating${forceStar}`] = forceColor;
            settings = { ...settings, ...newColors };
        };

        const section = sk.ui.make.container({ flex: true });

        for (const star of [1, 2, 3, 4, 5]) {
            const min = star > 2 ? getRGB(settings[`rating${star - 1}`]) : getRGB(settings.rating1);
            const max = getRGB(settings[`rating${star}`]);

            const column = sk.ui.make.container({
                flex: true,
                style: { 'flex-direction': 'column' }
            });

            for (const modifier of [0.25, 0.5, 0.75, 1]) {
                const color = getTransitionColor(modifier, min, max);

                const card = sk.ui.make.container({
                    class: 'card',
                    style: { 'background-color': color }
                });
                const subTitle = sk.ui.make.subTitle({ text: `Rating ${star} (${modifier * 100})%` });

                card.append(subTitle);
                column.append(card);
            };

            section.append(column);
        };

        return section;
    };

    function saveNewColors() {
        const currentSettings = sk.plugin.get(pluginName);
        const newSettings = { ...currentSettings, ...newColors };

        sk.plugin.update({
            name: pluginName,
            options: newSettings
        });
    };

    function skKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k r g',
                    action: 'Open the rating GUI',
                    callback: styleGUI
                },
                {
                    sequence: 'esc',
                    action: 'Close the rating GUI',
                    callback: () => sk.tool.get('#skUI_Rating_GUI').remove(),
                    selector: '#skUI_Rating_GUI'
                }
            ]
        });
    };

    initialize();
})();