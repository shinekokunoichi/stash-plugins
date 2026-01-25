(async function () {
    const rating = sk.stash.getConfiguration().ui.ratingSystemOptions;
    let settings = sk.plugins.get('skUI - Rating');

    function defaultSettings() {
        return {
            banner: settings.banner === undefined ? false : settings.banner,
            rating1: settings.rating1 === undefined ? 'rgb(0 0 0)' : settings.rating1,
            rating2: settings.rating2 === undefined ? 'rgb(0 100 0)' : settings.rating2,
            rating3: settings.rating3 === undefined ? 'rgb(70 130 180)' : settings.rating3,
            rating4: settings.rating4 === undefined ? 'rgb(102 51 153)' : settings.rating4,
            rating5: settings.rating5 === undefined ? 'rgb(255 140 0)' : settings.rating5
        };
    };

    function fullRating() {
        const rating1 = sk.ui.getAll('.card:has(.rating-1)');
        const rating2 = sk.ui.getAll('.card:has(.rating-2)');
        const rating3 = sk.ui.getAll('.card:has(.rating-3)');
        const rating4 = sk.ui.getAll('.card:has(.rating-4)');
        const rating5 = sk.ui.getAll('.card:has(.rating-5)');
        if (rating1[0]) rating1.forEach((card) => { card.css('background-color', settings.rating1, 'important') });
        if (rating2[0]) rating2.forEach((card) => { card.css('background-color', settings.rating2, 'important') });
        if (rating3[0]) rating3.forEach((card) => { card.css('background-color', settings.rating3, 'important') });
        if (rating4[0]) rating4.forEach((card) => { card.css('background-color', settings.rating4, 'important') });
        if (rating5[0]) rating5.forEach((card) => { card.css('background-color', settings.rating5, 'important') });
    };

    function isRGB(min, max) {
        if (min.includes('rgb') && max.includes('rgb')) return true;
        return false;
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
            const cards = sk.ui.getAll(`.card:has(.rating-100-${value})`);
            if (cards[0]) cards.forEach((card) => {
                const color = isRGB(min, max) ? getGradient(perc[i], min, max) : max;
                card.css('background-color', color, 'important');
            });
        });
    };

    function halfRating() {
        const rating1 = [1, 2, 3, 4];
        const rating2 = [5, 6, 7, 8];
        const rating3 = [9, 10, 11, 12];
        const rating4 = [13, 14, 15, 16];
        const rating5 = [17, 18, 19, 20];
        getHalfCard(rating1, settings.rating1, settings.rating1);
        getHalfCard(rating2, settings.rating1, settings.rating2);
        getHalfCard(rating3, settings.rating2, settings.rating3);
        getHalfCard(rating4, settings.rating3, settings.rating4);
        getHalfCard(rating5, settings.rating4, settings.rating5);
    };

    function main() {
        settings = defaultSettings();
        if (!settings.banner) sk.ui.getAll('.rating-banner').forEach((banner) => { banner.css('display', 'none') });
        if (rating.type === 'star' && rating.starPrecision === 'full') fullRating();
        if (rating.type === 'decimal' || rating.starPrecision !== 'full') halfRating();
    };

    sk.wait('.rating-banner', main);
})();