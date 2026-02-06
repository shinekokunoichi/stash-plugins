(async function () {
    const pluginName = 'skUI - Rating'
    let settings, rating;

    function fullRating() {
        const rating1 = sk.tool.getAll('.card:has(.rating-1)');
        const rating2 = sk.tool.getAll('.card:has(.rating-2)');
        const rating3 = sk.tool.getAll('.card:has(.rating-3)');
        const rating4 = sk.tool.getAll('.card:has(.rating-4)');
        const rating5 = sk.tool.getAll('.card:has(.rating-5)');
        if (rating1[0]) rating1.forEach((card) => { card.style({ 'background-color': settings.rating1 }, true); })
        if (rating2[0]) rating2.forEach((card) => { card.style({ 'background-color': settings.rating2 }, true); });
        if (rating3[0]) rating3.forEach((card) => { card.style({ 'background-color': settings.rating3 }, true); });
        if (rating4[0]) rating4.forEach((card) => { card.style({ 'background-color': settings.rating4 }, true); });
        if (rating5[0]) rating5.forEach((card) => { card.style({ 'background-color': settings.rating5 }, true); });
    };

    function toRGB(color) {
        if (color.includes('rgb')) return color;
        if (!color.includes('#')) return color;
        const [r, g, b] = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b), 16})`;
    };

    function getGradient(modifier, min, max) {
        min = min.replaceAll('rgb(', '').replaceAll(')', '');
        min = min.includes(',') ? min.split(',') : min.split(' ');
        max = max.replaceAll('rgb(', '').replaceAll(')', '');
        max = max.includes(',') ? max.split(',') : max.split(' ');
        const r = Number(min[0]) + Number(max[0]) - (Number(min[0]) * modifier);
        const g = Number(min[1]) + Number(max[1]) - (Number(min[1]) * modifier);
        const b = Number(min[2]) + Number(max[2]) - (Number(min[2]) * modifier);
        const a = min.includes('a') && max.includes('a') ? Number(min[3]) + Number(max[3]) / 2 : 1;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    };

    function getHalfCard(rating, min, max) {
        const perc = [0.25, 0.50, 0.75, 1];
        rating.forEach((value, i) => {
            const cards = sk.tool.getAll(`.card:has(.rating-100-${value})`);
            if (cards[0]) cards.forEach((card) => {
                min = toRGB(min);
                max = toRGB(max);
                const color = options.transition && min.includes('rgb') || max.includes('rgb') ? getGradient(perc[i], min, max) : max;
                card.style({'background-color':color}, true);
            });
        });
    };

    function halfRating() {
        getHalfCard([1, 2, 3, 4], settings.rating1, settings.rating1);
        getHalfCard([5, 6, 7, 8], settings.rating1, settings.rating2);
        getHalfCard([9, 10, 11, 12], settings.rating2, settings.rating3);
        getHalfCard([13, 14, 15, 16], settings.rating3, settings.rating4);
        getHalfCard([17, 18, 19, 20], settings.rating4, settings.rating5);
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
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
        rating = sk.stash.configuration.ui.ratingSystemOptions;
        if (!settings.banner) sk.tool.getAll('.rating-banner').forEach((banner) => { banner.style({ display: 'none' }) });
        if (rating.type === 'stars' && rating.starPrecision === 'full') fullRating();
        if (rating.type === 'decimal' || rating.starPrecision !== 'full') halfRating();
    };

    sk.tool.wait('.rating-banner', main);
})();