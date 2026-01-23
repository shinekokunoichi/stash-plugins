(async function () {
    let settings = sk.plugins.get('skUI - Rating');
    const defaultSettings = {
        banner: false,
        rating1: 'black',
        rating2: 'darkgreen',
        rating3: 'steelblue',
        rating4: 'rebeccapurple',
        rating5: 'darkorange'
    };

    function main() {
        if (!settings) settings = defaultSettings;
        const rating1 = sk.ui.getAll('.card:has(.rating-1)');
        const rating2 = sk.ui.getAll('.card:has(.rating-2)');
        const rating3 = sk.ui.getAll('.card:has(.rating-3)');
        const rating4 = sk.ui.getAll('.card:has(.rating-4)');
        const rating5 = sk.ui.getAll('.card:has(.rating-5)');
        if (!settings.banner) sk.ui.getAll('.rating-banner').forEach((banner) => { banner.css('display', 'none') });
        if (rating1[0]) rating1.forEach((card) => { card.css('background-color', settings.rating1, 'important') });
        if (rating2[0]) rating2.forEach((card) => { card.css('background-color', settings.rating2, 'important') });
        if (rating3[0]) rating3.forEach((card) => { card.css('background-color', settings.rating3, 'important') });
        if (rating4[0]) rating4.forEach((card) => { card.css('background-color', settings.rating4, 'important') });
        if (rating5[0]) rating5.forEach((card) => { card.css('background-color', settings.rating5, 'important') });
    };

    sk.wait('.rating-banner', main);
})();