(() => {
    const pluginName = 'skUI - Rating'
    let settings;
    const decimal = {
        1: [1, 2, 3, 4],
        2: [5, 6, 7, 8],
        3: [9, 10, 11, 12],
        4: [13, 14, 15, 16],
        5: [17,18,19,20]
    };

    function toRGB(color, alpha = 1) {
        if (color.includes('rgb') && !alpha) return color;
        if (color.includes('rgb') && alpha) {
            const [r, g, b] = color.replace('rgb', '').replace('(', '').replace(')', '').split(',');
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const [r, g, b] = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b), 16}, ${alpha})`;
    };

    function getGradient(modifier, min, max, alpha) {
        min = min.replaceAll('rgb(', '').replaceAll(')', '');
        min = min.includes(',') ? min.split(',') : min.split(' ');
        max = max.replaceAll('rgb(', '').replaceAll(')', '');
        max = max.includes(',') ? max.split(',') : max.split(' ');
        const r = Number(min[0]) + Number(max[0]) - (Number(min[0]) * modifier);
        const g = Number(min[1]) + Number(max[1]) - (Number(min[1]) * modifier);
        const b = Number(min[2]) + Number(max[2]) - (Number(min[2]) * modifier);
        return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgba(${r}, ${g}, ${b})`;
    };
    function cardFullRating(selector) {
        const rating1 = sk.tool.getAll('.card:has(.rating-1)');
        const rating2 = sk.tool.getAll('.card:has(.rating-2)');
        const rating3 = sk.tool.getAll('.card:has(.rating-3)');
        const rating4 = sk.tool.getAll('.card:has(.rating-4)');
        const rating5 = sk.tool.getAll('.card:has(.rating-5)');
        if (rating1[0]) rating1.forEach((card) => { card.style({ 'background-color': toRGB(settings.rating1) }, true); })
        if (rating2[0]) rating2.forEach((card) => { card.style({ 'background-color': toRGB(settings.rating2) }, true); });
        if (rating3[0]) rating3.forEach((card) => { card.style({ 'background-color': toRGB(settings.rating3) }, true); });
        if (rating4[0]) rating4.forEach((card) => { card.style({ 'background-color': toRGB(settings.rating4) }, true); });
        if (rating5[0]) rating5.forEach((card) => { card.style({ 'background-color': toRGB(settings.rating5) }, true); });
    };

    function cardHalfRating() {
        function prepare() {
            apply(decimal['1'], settings.rating1, settings.rating1);
            apply(decimal['2'], settings.rating1, settings.rating2);
            apply(decimal['3'], settings.rating2, settings.rating3);
            apply(decimal['4'], settings.rating3, settings.rating4);
            apply(decimal['5'], settings.rating4, settings.rating5);
        };
        function apply(rating, min, max) {
            const perc = [0.25, 0.50, 0.75, 1];
            rating.forEach((value, i) => {
                const cards = sk.tool.getAll(`.card:has(.rating-100-${value})`);
                if (cards[0]) cards.forEach((card) => {
                    min = toRGB(min);
                    max = toRGB(max);
                    const color = options.transition && min.includes('rgb') || max.includes('rgb') ? getGradient(perc[i], min, max) : max;
                    card.style({ 'background-color': color }, true);
                });
            });
        };
        prepare();
    };

    function card() {
        const rating = sk.stash.configuration().ui.ratingSystemOptions;
        if (!settings.banner) sk.tool.getAll('.rating-banner').forEach((banner) => { banner.style({ display: 'none' }) });
        if (rating.type === 'stars' && rating.starPrecision === 'full') cardFullRating();
        if (rating.type === 'decimal' || rating.starPrecision !== 'full') cardHalfRating();
    };

    function pageFullRating(rating, element) {
        const rgba = toRGB(settings[`rating${rating}`], 0.25);
        element.style({ 'background-color': rgba }, true);
    };

    function pageHalfRating(rating, element) {
        rating = Number(rating);
        if (decimal['1'].includes(rating)) apply(decimal['1'], settings.rating1, settings.rating1);
        if (decimal['2'].includes(rating)) apply(decimal['2'], settings.rating1, settings.rating2);
        if (decimal['3'].includes(rating)) apply(decimal['3'], settings.rating2, settings.rating3);
        if (decimal['4'].includes(rating)) apply(decimal['4'], settings.rating3, settings.rating4);
        if (decimal['5'].includes(rating)) apply(decimal['5'], settings.rating4, settings.rating5);

        function apply(values, min, max) {
            const perc = [0.25, 0.50, 0.75, 1];
            const i = values.indexOf(rating);
            min = toRGB(min);
            max = toRGB(max);
            const color = options.transition && min.includes('rgb') || max.includes('rgb') ? getGradient(perc[i], min, max, 0.25) : max;
            element.style({ 'background-color': color }, true);
        };
    };

    function page() {
        let category = window.location.pathname.split('/')[1];
        category = category === 'galleries' ? 'gallery' : category.substring(0, category.length - 1);
        const pageInfo = sk.ui.get.page[category]();
        const rating = sk.stash.configuration().ui.ratingSystemOptions;
        if (!pageInfo.rating.read()) return;
        const element = sk.tool.get('.detail-header') || pageInfo.info;
        if (rating.type === 'stars' && rating.starPrecision === 'full') pageFullRating(pageInfo.rating.read(), element);
        if (rating.type === 'decimal' || rating.starPrecision !== 'full') pageHalfRating(pageInfo.rating.read(), element);
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                card: true,
                page: true,
                banner: false,
                transition: true,
                rating1: 'rgb(0, 0, 0)',
                rating2: 'rgb(0, 100, 0)',
                rating3: 'rgb(70, 130, 180)',
                rating4: 'rgb(102, 51, 153)',
                rating5: 'rgb(255, 140, 0)'
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        if (settings.card) sk.tool.wait('.rating-banner', card);
        if (settings.page) ['scene', 'image', 'group', 'gallery', 'performer', 'studio', 'tag'].forEach((category) => { sk.tool.wait(sk.ui.is[`${category}Page`], page); });
    };

    main();
})();