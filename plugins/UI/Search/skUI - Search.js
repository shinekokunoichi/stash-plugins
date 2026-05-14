(() => {
    const pluginName = 'sKUI - Search';
    let preloadedGlobalData, awesomplete, omnisearch;

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
        skExtraKeybinderCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                globalSearch: true,
                alphabetSearch: true
            }
        })
    };

    // Watcher
    function setWatcher() {
        const { globalSearch, alphabetSearch } = sk.plugin.get(pluginName);

        if (globalSearch) sk.tool.wait('.navbar', createGlobalSearch, true);
        if (alphabetSearch) sk.tool.wait('.filtered-list-toolbar', createAlphabetSearch);
    };

    async function createGlobalSearch() {
        if (sk.tool.get('#skUI_Search_Global')) return;
        preloadedGlobalData = {};

        for (const category of ['scenes', 'images', 'groups', 'markers', 'galleries', 'performers', 'studios', 'tags']) {
            const titleName = category === 'scenes' || category === 'images' || category === 'markers' || category === 'galleries' ? 'title' : 'name';
            const imageField = getImageField(category);

            preloadedGlobalData[category] = await sk.stash.find[category]({ fields: `${titleName} ${imageField} ${getAllFields(category)}` }) || [];
        };

        await prepareOmniSearch();

        const searchBox = createAwesompleteInput();
        sk.ui.get.navbar().nav.append(searchBox);
    };

    function getAllFields(category) {
        let fields = 'id';

        if (category === 'scenes') fields += ' code director groups {group {name}}';
        if (category === 'markers') fields += ' primary_tag {name}';
        if (category !== 'tags') fields += ' tags {name}';
        
        if (category === 'scenes' || category === 'images' || category === 'groups') fields += ' o_counter';
        if (category === 'scenes' || category === 'images' || category === 'groups' || category === 'galleries') fields += ' date';
        if (category === 'scene' || category === 'images' || category === 'studios') fields += ' organized'
        

        if (category !== 'markers' && category !== 'tags') fields += ' rating100';
        if (category !== 'performers' && category !== 'groups' && category !== 'markers' && category !== 'studios' && category !== 'tags') fields += ' performers {name}';
        if (category !== 'studios' && category !== 'markers' && category !== 'performers' && category !== 'tags') fields += ' studio {name}';
        

        return fields;
    };

    function getImageField(category, splitted) {
        let preview;

        if (category === 'scenes') preview = ['paths', 'screenshot'];
        if (category === 'images') preview = ['paths', 'thumbnail'];
        if (category === 'groups') preview = ['front_image_path'];
        if (category === 'markers') preview = ['screenshot'];
        if (category === 'galleries') preview = ['cover', 'paths {thumbnail}'];
        if (category === 'performers' || category === 'studios' || category === 'tags') preview = ['image_path']

        return splitted ? preview :
            preview.length > 1 ? `${preview[0]} {${preview[1]}}` : preview[0];
    };

    async function prepareOmniSearch() {
        let mappedData = [];

        for (const category in preloadedGlobalData) {
            const imageField = getImageField(category, true);
            const galleryField = getImageField('images', true);

            preloadedGlobalData[category].forEach(entry => {
                let preview = imageField.length > 1 && category !== 'galleries' ? entry[imageField[0]][imageField[1]] : entry[imageField[0]];
                if (category === 'galleries') preview = preview[galleryField[0]][galleryField[1]];

                const data = {
                    _category: category,
                    id: entry.id,
                    value: entry.title || entry.name || '',
                    preview: preview,
                    groups: entry?.groups ? entry.groups.map(group => {group.group.name.toLowerCase()}) : [],
                    performers: entry?.performers ? entry.performers.map(performer => performer.name.toLowerCase()) : [],
                    studio: entry?.studio?.name ? entry.studio.name : '',
                    tags: entry.tags ? entry.tags.map(tag => tag.name.toLowerCase()) : []
                };
                if (category === 'markers') data.tags.push(data.primary_tag.name);

                mappedData.push(data);
            });

            omnisearch = mappedData;
        };
    };

    function createAwesompleteInput() {
        const group = sk.ui.make.container({
            id: 'skUI_Search_Global',
            class: 'autocomplete-container',
            style: { 'text-align': 'center' }
        });
        const input = sk.ui.make.input({
            id: 'global-search-autocomplete',
            class: 'form-control awesomplete',
            attribute: { placeholder: 'title/name, @category title/name, #attributes value, @category #attributes value' },
            event: {
                type: 'input',
                callback: () => getGlobalResults(input)
            }
        });
        group.append(input);

        awesomplete = new Awesomplete(input.element, {
            minChars: 1,
            maxItems: 10,
            item: (text) => {
                const [id, category, name, image_path] = text.split('|');

                const li = document.createElement('li');
                li.onclick = () => window.open(`${window.location.origin}/${category}/${id}`, '_blank');

                const img = document.createElement('img');
                img.src = image_path.trim();

                const div = document.createElement('div');
                div.textContent = `${category[0].toUpperCase()}${category.slice(1)} - ${name.trim()}`;

                li.appendChild(img);
                li.appendChild(div);
                return li;
            },
            replace: (text) => {
                const [id, category, name] = text.split('|');
                input.value(name.trim());
            },
            filter: () => true
        });
        return group;
    };

    function getGlobalResults(input) {
        const search = input.value();

        if (search[0] !== '@' && search[0] !== '#') omniGlobalResults(search);

        if (search[0] === '@' || search[0] === '#') {
            let filtered = omnisearch;
            let filteredSearch = '';
            const parameters = search.split(' ');

            for (const parameter of parameters) {

                if (parameter[0] === '@') filtered = filterGlobalResults(filtered, parameter);
                if (parameter[0] === '#') filtered = filterGlobalResults(filtered, parameter.split(':')[0], parameter.split(':')[1]);


                if (parameter[0] !== '@' && parameter[0] !== '#') filteredSearch = parameter.trim();
            };

            omniGlobalResults(filteredSearch, filtered);
        };
    };

    function omniGlobalResults(search, filtered) {
        const mappedData = filtered || omnisearch;
        const find = mappedData.filter(entry => entry.value.toLowerCase().includes(search));
        const toShow = find.map(entry => `${entry.id}|${entry._category}|${entry.value}|${entry.preview}`);
        awesomplete.list = toShow;
    };

    function filterGlobalResults(currentFilter, parameter, value) {
        let filteredData;

        if (parameter[0] === '@') filteredData = currentFilter.filter(entry => entry._category === parameter.split('@')[1].toLowerCase());
        if (parameter[0] === '#' && value) filteredData = currentFilter.filter(entry => entry[parameter.split('#')[1].toLowerCase()].toString().includes(value.toLowerCase().split('_').join(' ')));

        return filteredData;
    };

    function createAlphabetSearch() {
        if (sk.tool.get('#skUI_Search_AlphabetSearch')) return;

        const search = sk.ui.make.container({
            id: 'skUI_Search_AlphabetSearch',
            class: 'btn-group',
            flex: true,
            style: { padding: '2vh 0' }
        }); 

        const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
        alphabet.forEach(char => {
            const isActive = sessionStorage.getItem(pluginName) === char ? ' active' : '';

            const button = sk.ui.make.button({
                text: char,
                class: `btn-secondary${isActive}`,
                style: {
                    border: 'none',
                    padding: '1vh 1vw'
                },
                event: {
                    type: 'click',
                    callback: () => filterByAlphabet(char, button)
                }
            });

            search.append(button);
        });

        const filterBar = sk.tool.get('.filtered-list-toolbar').element;
        filterBar.parentNode.insertBefore(search.element, filterBar.nextSibling);
    };

    function filterByAlphabet(char, button) {
        sk.tool.get('.filter-button').click();

        const filterName = sk.tool.get("div[data-type='name']") || sk.tool.get("div[data-type='title']");
        filterName.get('button').click();

        const input = filterName.get('input');
        const apply = sk.tool.get('.modal-footer').element.lastChild.lastChild;

        let matchRegExp;
        filterName.getAll('.modifier-options button').forEach(el => el.read() === 'matches regex' ? matchRegExp = el : null);
        matchRegExp.click();

        const alreadySetted = filterName.get('.remove-criterion-button');

        if (alreadySetted) {
            sk.tool.get('#skUI_Search_AlphabetSearch .active').class('active');
            alreadySetted.click();
            apply.click();
        };

        if (!alreadySetted) {
            input.attribute({ value: `^[${char}${char.toUpperCase()}]` });
            input.element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
            apply.click();

            button.class('active');
            sessionStorage.setItem(pluginName, char);
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
                    version: '2.0',
                    description: 'Added global search.\nAdded compatibility to skManager.'
                }
            ]
        });
    };

    function skExtraKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k Shift+s',
                    action: 'Focus the global search',
                    callback: () => sk.tool.get('#skUI_Search_Global').element.focus()
                }
            ]
        });
    };

    initialize();
})();