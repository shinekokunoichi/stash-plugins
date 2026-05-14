(() => {
    const pluginName = 'skExtra - Related-Content';
    let awesomplete, manualData;

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                showAutomatic: true,
                showAutomaticFilter: 'scene, image, group, gallery, performer, studio',
                showManual: false,
                showManualFilter: 'scene, image, group, gallery, performer, studio',
                automaticReq: 5,
                autoLink: true
            }
        });
    };

    // Watcher
    function setWatcher() {
        const { showAutomaticFilter, showManualFilter } = sk.plugin.get(pluginName);
        const automaticCategories = showAutomaticFilter.includes(',') ? showAutomaticFilter.split(',') : showAutomaticFilter.split(' ');
        const manualCategories = showManualFilter.includes(',') ? showManualFilter.split(',') : showManualFilter.split(' ');
        [...new Set(automaticCategories.concat(manualCategories))].forEach(category => sk.tool.wait(sk.ui.is[`${category}Page`], () => createRelatedTab(category)));
    };

    async function createRelatedTab(category) {
        if (sk.tool.get('#skPPT_Related')) return;
        const page = sk.ui.get.page[category]();
        if (!page.navbar) return;

        const relatedTab = page.navbar.add('Related');
        relatedTab.flex();
        relatedTab.style({ 'flex-direction': 'column' });

        const toGet = category === 'gallery' ? 'galleries' : `${category}s`;
        let imageField = getImageField(category);
        imageField = imageField.length === 1 ? imageField : `${imageField.join('{')}}`;
        const fields = `id tags { name } custom_fields ${isNameOrTitle(category)} ${imageField}`;
        const data = await sk.stash.find[toGet]({ fields: fields });
        const { showAutomatic, showManual } = sk.plugin.get(pluginName);

        if (showAutomatic) relatedTab.append(showAutomaticSection(data, category));
        if (showManual) relatedTab.append(showManualSection(data, category));
        showRelatedSection(data, category, page.id);
    };

    function isNameOrTitle(category) {
        if (category === 'scene' || category === 'image' || category === 'gallery') return 'title';
        if (category === 'group' || category === 'performer' || category === 'studio') return 'name';
    };

    function getImageField(category) {
        let field;
        if (category === 'scene') field = ['paths', 'screenshot'];
        if (category === 'image') field = ['paths', 'thumbnail']
        if (category === 'group') field = ['front_image_path'];
        if (category === 'gallery') field = ['paths', 'cover'];
        if (category === 'performer' || category === 'studio') field = ['image_path'];
        return field;
    };

    function showAutomaticSection(data, category) {
        const title = sk.ui.make.subTitle({ text: 'Automatic' });
        const results = sk.ui.make.container({
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });

        const { automaticReq } = sk.plugin.get(pluginName);
        const page = sk.ui.get.page[category]();
        const pageTags = page.tags ? page.tags.map(tag => tag.read()).join(' ') : page.getDetails('tags').split('\n');

        data.forEach((entry) => {
            if (!entry.tags[0] || entry[isNameOrTitle(category)] === page[isNameOrTitle(category)].read()) return;
            const relatedTags = entry.tags.filter(tag => pageTags.includes(tag) ? tag : null);
            if (relatedTags.length >= automaticReq) createRelatedCard(category, entry, results);
        });
        return [title, results];
    };

    function createRelatedCard(category, entry, parent) {
        const name = entry[isNameOrTitle(category)];
        const [field, subField] = getImageField(category);
        const image = subField ? entry[field][subField] : entry[field];

        const card = sk.ui.make.container({ style: { padding: '5%' } });
        const page = sk.ui.make.link({
            url: `/${category}/${entry.id}`,
            style: { 'text-align': 'center' }
        });
        const thumbnail = sk.ui.make.image({
            url: image,
            style: { width: '150px' }
        });
        const title = sk.ui.make.description({
            text: name,
            style: { margin: 0 }
        });

        page.append(title, thumbnail);
        card.append(page);
        if (parent) parent.append(card);
        return card;
    };

    function showManualSection(data, category) {
        manualData = data.filter(entry => entry.id != sk.ui.get.page[category]().id ? entry : null);

        const title = sk.ui.make.subTitle({ text: 'Manual' });
        const results = sk.ui.make.container({
            id: 'skExtra_Related_Content_ManualSection',
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });

        return [title, results, createAwesompleteInput(category)];
    };

    function createAwesompleteInput(category) {
        const group = sk.ui.make.container({
            class: 'autocomplete-container',
            style: { 'text-align': 'center' }
        });
        const label = sk.ui.make.subTitle({
            text: 'Add related',
            style: { 'text-align': 'center' },
            attribute: { for: 'manualData-autocomplete' }
        });
        const input = sk.ui.make.input({
            id: 'manualData-autocomplete',
            class: 'form-control awesomplete',
            attribute: { 'data-list': '', '_category': category },
            event: {
                type: 'click',
                callback: () => filterResults(input.element)
            }
        });
        const button = sk.ui.make.button({
            text: 'Add related',
            class: 'btn btn-primary',
            event: {
                type: 'click',
                callback: () => linkNewRelated(input.element)
            }
        });
        group.append(label, input, button);

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

        return group;
    };

    function filterResults(input) {
        input.manualData = {};
        manualData.forEach(entry => entry.name ? input.manualData[entry.name] = entry : input.manualData[entry.title] = entry );
        const [field, subField] = getImageField(input.attributes._category.value);
        awesomplete.list = manualData.map(data => `${data.name || data.title}|${subField ? data[field][subField] : data[field]}`);
    };

    async function linkNewRelated(input) {
        const name = input.value.trim();
        if (!name || !input.manualData[name]) return;

        const category = input.attributes._category.value;
        const id = sk.ui.get.page[category]().id;
        let related = input.manualData[name].custom_fields;
        related = related[pluginName] ? related.split('|') : [];

        let toAdd;
        manualData.forEach((entry) => {
            if (entry[isNameOrTitle(category)] === name && !related.includes(entry.id)) {
                toAdd = entry;
                related.push(entry.id);
            };
        });
        const { autoLink } = sk.plugin.get(pluginName);
        await sk.stash.update[category]({
            id: id,
            custom_fields: {
                partial: { [pluginName]: related.join('|') }
            }
        });
        if (autoLink) await sk.stash.update[category]({
            id: toAdd.id,
            custom_fields: {
                partial: { [pluginName]: `${toAdd.custom_fields[pluginName]}|${id}` }
            }
        });

        sk.tool.get('#skExtra_Related_Content_ManualSection').append(createRelatedCard(category, toAdd));
    };

    async function showRelatedSection(data, category, id){
        const current = data.filter(entry => entry.id == id ? entry : null)[0];
        if (current.custom_fields[pluginName]) {
            current.custom_fields[pluginName].trim().split('|').forEach(id => {
                let cardData;
                data.forEach(entry => entry.id == id ? cardData = entry : null);
                createRelatedCard(category, cardData, sk.tool.get('#skExtra_Related_Content_ManualSection'));
            });
        };
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                },
                {
                    version: '1.1',
                    description: 'Added compatibility to skManager.'
                },
                {
                    version: '1.1.1',
                    description: 'Fixed missing update description.'
                }
            ]
        });
    };

    initialize();
})()