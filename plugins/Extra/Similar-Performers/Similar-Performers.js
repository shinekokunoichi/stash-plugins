(() => {
    const pluginName = 'skExtra - Similar-Performers';
    let settings, performers, awesomplete;
    let cards = {};

    //UI
    function makeCard(performer) {
        if (cards[performer.id]) return;
        const card = sk.ui.make.container({ style: { padding: '5%' } });
        const page = sk.ui.make.link({ url: `/performers/${performer.id}`, style: { 'text-align': 'center' } });
        const image = sk.ui.make.image({ url: performer.image_path, style: { width: '150px' } });
        const name = sk.ui.make.description({ text: performer.name, style: { margin: 0 } });
        page.append([name, image]);
        card.append(page);
        cards[performer.id] = card;
        return card;
    };

    async function create() {
        if (sk.tool.get('#skPPTC_Related')) return;
        const details = sk.ui.get.performerDetails();
        const content = details.navbar.add('Related');
        content.flex();
        content.style({ 'flex-direction': 'column' });
        performers = await sk.stash.find.performers({ fields: 'id name image_path tags { name } custom_fields' });
        if (settings.showAutomatic) {
            const auto = sk.ui.make.subTitle({ text: 'Automatic' });
            const autoResult = sk.ui.make.container({ flex: true });
            content.append([auto, autoResult]);
            //Related
            const tags = details.getDetails('tags').split('\n');
            performers.forEach((performer) => {
                if (!performer.tags[0] || performer.name === details.name.read()) return;
                const relatedTags = performer.tags.filter((tag) => { if (tags.includes(tag.name)) return performer; });
                if (relatedTags.length >= settings.automaticReq) {
                    const card = makeCard(performer);
                    if (card) autoResult.append(card);
                };
            });
        };
        if (settings.showManual) {
            const manual = sk.ui.make.subTitle({ text: 'Manual' });
            const manualResult = sk.ui.make.container({ id: 'skERPManual', flex: true });
            content.append([manual, manualResult]);
            //Awesomplete
            const group = sk.ui.make.container({ class: 'autocomplete-container', style: { 'text-align': 'center' } });
            const label = sk.ui.make.subTitle({ text: 'Add related performers', style: { 'text-align': 'center' }, attribute: { for: 'performer-autocomplete' } });
            const input = sk.ui.make.input({ id: 'performer-autocomplete', class: 'form-control awesomplete', attribute: { 'data-list': '' }, event: { type: 'click', callback: () => filter(input.element) } });
            const button = sk.ui.make.button({ text: 'Add performer', class: 'btn btn-primary', event: { type: 'click', callback: () => link(input.element) } });
            group.append([label, input, button]);
            content.append(group);
            awesomplete = new Awesomplete(input.element, {
                minChars: 1,
                maxItems: 10,
                item: (text, input) => {
                    const [name, image_path] = text.split('|');
                    const li = document.createElement('li');
                    const img = document.createElement('img');
                    img.src = image_path.trim();
                    const div = document.createElement('div');
                    div.textContent = name.trim();
                    li.appendChild(img);
                    li.appendChild(div);
                    return li;
                },
                replace: (text) => {
                    const [name] = text.split('|');
                    input.value(name.trim());
                }
            });
            //Related
            const ids = sk.ui.get.performerDetails().getCustomField('skExtra-Similar-Performers');
            if (ids) {
                ids.trim().split(' ').forEach((id) => {
                    let performer;
                    performers.forEach((entry) => { if (entry.id === id) performer = entry });
                    const card = makeCard(performer);
                    if (card) manualResult.append(card);
                });
            };
        };
    };

    //Autocomplete

    function filter(input) {
        input.performersMap = performers.reduce((map, performer) => {
            map[performer.name] = performer;
            return map;
        });
        awesomplete.list = performers.map(performer => `${performer.name} | ${performer.image_path}`);
    };

    async function link(input) {
        const name = input.value.trim();
        if (!name || !input.performersMap[name]) return;
        const id = window.location.pathname.split('/')[2];
        const related = sk.ui.get.performerDetails().getCustomField('skExtra-Similar-Performers').split(' ') || [];
        let toAdd;
        performers.forEach((performer) => {
            if (performer.name === name && !related.includes(performer.id)) {
                toAdd = performer;
                related.push(performer.id);
            };
        });
        await sk.stash.update.performer({ id: id, custom_fields: { partial: { skExtra_Similar_Performers: related.join(' ') } } });
        if (settings.autoLink) await sk.stash.update.performer({ id: toAdd.id, custom_fields: { partial: { skExtra_Similar_Performers: `${toAdd.custom_fields.skExtra_Similar_Performers} ${id}` } } });
        sk.tool.get('#skERPManual').append(makeCard(toAdd));
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                showAutomatic: true,
                showManual: true,
                automaticReq: 5,
                autoLink: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.tool.wait('.custom-fields', create);
    };

    main();
})();