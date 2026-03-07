(() => {
    const pluginName = 'skExtra - Related-Content';
    let settings, awesomplete, performers;

    function makeCard(category, entry, parent) {
        const name = entry[nameField(category)];
        const field = imageField(category, true);
        const image = field.length == 2 ? entry[field[0]][field[1]] : entry[field[0]];
        const card = sk.ui.make.container({ style: { padding: '5%' } });
        const page = sk.ui.make.link({ url: `/${category}/${entry.id}`, style: { 'text-align': 'center' } });
        const thumbnail = sk.ui.make.image({ url: image, style: { width: '150px' } });
        const title = sk.ui.make.description({ text: name, style: { margin: 0 } });
        page.append([title, thumbnail]);
        card.append(page);
        if (parent) parent.append(card);
        if (!parent) return card;
    };

    function nameField(category) {
        if (category === 'scene' || category === 'image' || category === 'gallery') return 'title';
        if (category === 'group' || category === 'performer' || category === 'studio') return 'name';
    };

    function imageField(category, get) {
        let field;
        if (category === 'scene') field = 'paths screenshot';
        if (category === 'image') field = 'paths thumbnail';
        if (category === 'group') field = 'front_image_path';
        if (category === 'gallery') field = 'paths cover';
        if (category === 'performer' || category === 'studio') field = 'image_path';
        field = field.split(' ');
        if (!get) return field.length === 2 ? `${field[0]}{${field[1]}}` : field[0];
        if (get) return field;
    };

    async function create(category) {
        if (sk.tool.get('#skPPT_Related')) return;
        let page = sk.ui.get.page[category]();
        if (!page.navbar) return;
        const skRC = page.navbar.add('Related');
        skRC.flex();
        skRC.style({ 'flex-direction': 'column' });
        const find = category === 'gallery' ? 'galleries' : `${category}s`;
        let fields = `id ${nameField(category)} ${imageField(category)} tags{name}`;
        if (category === 'performer') fields += ' custom_fields';
        if (fields.includes('undefined')) return;
        const elements = await sk.stash.find[find]({ fields: fields });
        if (settings.showAutomaticFilter.includes(category)) {
            const aTitle = sk.ui.make.subTitle({ text: 'Automatic' });
            const aResult = sk.ui.make.container({ flex: true, style: { 'flex-wrap': 'wrap' } });
            skRC.append([aTitle, aResult]);
            if (category !== 'performer' && category !== 'group' && category !== 'studio' && !page.tags[0]) page = sk.ui.get.page[category]();
            const tags = category === 'scene' || category === 'image' || category === 'gallery' ? page.tags.map((tag) => { return tag.read(); }).join(' ') : page.getDetails('tags').split('\n');
            elements.forEach((entry) => {
                if (!entry.tags[0] || entry[nameField(category)] === page[nameField(category)].read()) return;
                const relatedTags = entry.tags.filter((tag) => { if (tags.includes(tag.name)) return entry; });
                if (relatedTags.length >= settings.automaticReq) makeCard(category, entry, aResult);
            });
        };
        if (settings.showManualFilter.includes(category) && category === 'performer') {
            performers = elements;
            const mTitle = sk.ui.make.subTitle({ text: 'Manual' });
            const mResult = sk.ui.make.container({ id: 'skRC-Manual', flex: true, style: { 'flex-wrap': 'wrap' } });
            skRC.append([mTitle, mResult]);
            //Awesomplete
            const group = sk.ui.make.container({ class: 'autocomplete-container', style: { 'text-align': 'center' } });
            const label = sk.ui.make.subTitle({ text: 'Add related performers', style: { 'text-align': 'center' }, attribute: { for: 'performer-autocomplete' } });
            const input = sk.ui.make.input({ id: 'performer-autocomplete', class: 'form-control awesomplete', attribute: { 'data-list': '' }, event: { type: 'click', callback: () => filter(input.element) } });
            const button = sk.ui.make.button({ text: 'Add performer', class: 'btn btn-primary', event: { type: 'click', callback: () => link(input.element) } });
            group.append([label, input, button]);
            skRC.append(group);
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
            const ids = sk.ui.get.page.performer().getCustomField('skExtra-Related-Content');
            if (ids) {
                ids.trim().split('|').forEach((id) => {
                    let performer;
                    elements.forEach((entry) => { if (entry.id === id) performer = entry; });
                    makeCard(category, entry, mResult);
                });
            };
        };
        if (settings.showManualFilter.includes(category) && category !== 'performer') sk.tool.notify('skExtra - Related-Content', 'Currently performer is only supported as manual.');
    };

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
        const id = sk.ui.get.page.performer().id;
        const related = sk.ui.get.page.performer().getCustomField('skExtra-Related-Content').split('|') || [];
        let toAdd;
        performers.forEach((performer) => {
            if (performer.name === name && !related.includes(performer.id)) {
                toAdd = performer;
                related.push(performer.id);
            };
        });
        await sk.stash.update.performer({ id: id, custom_fields: { partial: { skExtra_Related_Content: related.join(' ') } } });
        if (settings.autoLink) await sk.stash.update.performer({ id: toAdd.id, custom_fields: { partial: { skExtra_Related_Content: `${toAdd.custom_fields.skExtra_Related_Content}|${id}` } } });
        sk.tool.get('#skRC-Manual').append(makeCard(category, toAdd));
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                showAutomatic: true,
                showAutomaticFilter: 'scene image group gallery performer studio',
                showManual: false,
                showManualFilter: 'performer',
                automaticReq: 5,
                autoLink: true
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        const hookPage = [...new Set(settings.showAutomaticFilter.split(' ').concat(settings.showManualFilter.split(' ')))];
        hookPage.forEach((category) => { sk.tool.wait(sk.ui.is[`${category}Page`], () => { create(category); }) });
    };

    main();
})();