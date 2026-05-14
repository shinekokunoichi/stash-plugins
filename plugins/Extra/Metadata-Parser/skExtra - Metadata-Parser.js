(() => {
    const pluginName = 'skExtra - Metadata-Parser';
    let createMissingData, customSettings, selectedParserData;
    let whatWillCreate = {};

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Tasks
        setTasks();

        // Compatibility
        skManagerCompatibility();
        skKeybinderCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                parsePath: true,
                pathParser: '',
                parseFile: true,
                fileSceneParser: '',
                fileImageParser: '',
                whitespace: '',
                ignoredWords: '',
                multipleDelimiters: '',
                dateFormat: 'yyyy-mm-dd',
                create: true
            }
        })
    };

    // Tasks
    function setTasks() {
        sk.task.add(
            {
                id: pluginName,
                name: 'GUI',
                description: 'Open metadata parser GUI',
                callback: parserGUI
            },
            {
                id: pluginName,
                name: 'Scenes',
                description: 'Parse scenes (not organized)',
                callback: () => parseNoGUI('scenes')
            },
            {
                id: pluginName,
                name: 'Force scenes',
                description: 'Parse scenes (all)',
                callback: () => parseNoGUI('scenes', true)
            },
            {
                id: pluginName,
                name: 'Images',
                description: 'Parse images (not organized)',
                callback: () => parseNoGUI('images')
            },
            {
                id: pluginName,
                name: 'Force images',
                description: 'Parse images (all)',
                callback: () => parseNoGUI('images', true)
            },
            {
                id: pluginName,
                name: 'All',
                description: 'Parse all (not organized)',
                callback: () => async () => {
                    await parseNoGUI('scenes');
                    await parseNoGUI('images');
                }
            },
            {
                id: pluginName,
                name: 'Force all',
                description: 'Parse all (organized)',
                callback: async () => {
                    await parseNoGUI('scenes', true);
                    await parseNoGUI('images', true);
                }
            }
        );
    };

    async function parserGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skExtra_Metadata_Parser_GUI',
            class: 'main container-fluid bg-dark',
            flex: true,
            style: {
                'flex-direction': 'column',
                top: 0,
                width: '100%',
                height: '100%'
            }
        });
        const title = sk.ui.make.title({ text: pluginName });
        const close = sk.ui.make.button({
            text: 'Close',
            class: 'btn btn-danger',
            style: {
                position: 'absolute',
                top: 0,
                right: 0
            },
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        })
        const card = sk.ui.make.container({
            class: 'card',
            style: {
                width: '100%',
                height: '90%',
                'overflow-y': 'auto'
            }
        });

        card.append(await GUISettings(), await GUIFields(), await GUIParser());
        
        gui.append(close, title, card);
        document.body.append(gui.element);
    };

    async function GUISettings() {
        const settingsContainer = sk.ui.make.container({
            flex: true,
            style: {
                'flex-direction': 'column',
                width: '100%',
                'justify-content': 'flex-start',
                'align-items': 'flex-start'
            }
        });
        const title = sk.ui.make.title({ text: 'Current Settings' });

        const card = sk.ui.make.container({
            flex: true,
            style: { width: '75%' }
        });
        const cardTitle = sk.ui.make.container({
            flex: true,
            style: {
                'flex-direction': 'column',
                'margin-right': 'auto',
                'align-items': 'flex-start'
            }
        });
        const cardValue = sk.ui.make.container({
            flex: true,
            style: { 'flex-direction': 'column' }
        });

        card.append(cardTitle, cardValue);
        settingsContainer.append(title, card);

        // Preset
        const name = (text) => sk.ui.make.description({
            text: text,
            style: {
                margin: '5px 0',
                height: '30px'
            }
        });
        const checkbox = (checked, id) => sk.ui.make.checkBox({
            id: `skExtra_Metadata_Parser_${id}`,
            class: 'skExtra_Metadata_Parser_CurrentSettings',
            attribute: { checked: checked },
            style: {
                margin: '5px 0',
                'align-self': 'flex-start',
                height: '30px'
            }
        });
        const input = (value, id) => sk.ui.make.input({
            id: `skExtra_Metadata_Parser_${id}`,
            class: 'text-input bg-dark skExtra_Metadata_Parser_CurrentSettings',
            value: value,
            style: {
                margin: '5px 0',
                width: '40rem',
                height: '30px'
            }
        });

        // Fields
        const { parsePath, pathParser, parseFile, fileSceneParser, fileImageParser, whitespace, ignoredWords, multipleDelimiters, dateFormat, create } = customSettings || sk.plugin.get(pluginName);

        const parsePathTitle = name('Parse path');
        const parsePathValue = checkbox(parsePath, 'parsePath');

        const pathParserTitle = name('Path parser');
        const pathParserValue = input(pathParser, 'pathParser');

        const parseFileTitle = name('Parse file');
        const parseFileValue = checkbox(parseFile, 'parseFile');

        const fileSceneParserTitle = name('Scene file parser');
        const fileSceneParserValue = input(fileSceneParser, 'fileSceneParser');

        const fileImageParserTitle = name('Image file parser');
        const fileImageParserValue = input(fileImageParser, 'fileImageParser');

        const whitespaceTitle = name('Whitespace replacer');
        const whitespaceValue = input(whitespace, 'whitespace');

        const ignoredWordsTitle = name('Ignored words');
        const ignoredWrodsValue = input(ignoredWords, 'ignoredWords');

        const multipleDelimitersTitle = name('Multiple delimiters');
        const multipleDelimitersValue = input(multipleDelimiters, 'multipleDelimiters');

        const dateFormatTitle = name('Date format');
        const dateFormatValue = input(dateFormat, 'dateFormat');

        const createTitle = name('Create missing data');
        const createValue = checkbox(create, 'create');

        cardTitle.append(parsePathTitle, pathParserTitle, parseFileTitle, fileSceneParserTitle, fileImageParserTitle, whitespaceTitle, ignoredWordsTitle, multipleDelimitersTitle, createTitle);
        cardValue.append(parsePathValue, pathParserValue, parseFileValue, fileSceneParserValue, fileImageParserValue, whitespaceValue, ignoredWrodsValue, multipleDelimitersValue, createValue);

        return settingsContainer;
    };

    async function GUIFields() {
        const fieldsContainer = sk.ui.make.container({
            flex: true,
            style: {
                'flex-direction': 'column',
                width: '100%',
                'justify-content': 'flex-start',
                'align-items': 'flex-start'
            }
        });
        const title = sk.ui.make.title({ text: 'Available fields' });
        const show = sk.ui.make.button({
            text: 'Show/Hide',
            class: 'btn btn-primary',
            event: {
                type: 'click',
                callback: () => sk.tool.getAll('.skExtra_Metadata_Parser_FieldCard').forEach(e => e.style({ display: e.style('display') === 'flex' ? 'none' : 'flex' }))
            }
        })

        const card = sk.ui.make.container({
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });

        // Fields
        const field = (name, description) => {
            const container = sk.ui.make.container({
                flex: true,
                class: 'card skExtra_Metadata_Parser_FieldCard',
                style: {
                    width: '200px',
                    height: '200px',
                    'justify-content': 'flex-start'
                }
            });
            const _title = sk.ui.make.subTitle({ text: `{${name}}` });
            const _description = sk.ui.make.description({ text: description });
            container.append(_title, _description);
            return container;
        };

        // General fields
        const _i = field('i', 'Remove any matching words (not case sensitive) from "Ignored Words" setting');
        const _I = field('I', 'Remove any matching words (case sensitive) from "Ignored Words" settings');
        const _d = field('d', 'Match any delimiter (.-_)');
        const _ext = field('ext', 'Remove the file extension (only for files and as last field)');

        // Metadata fields
        const _title = field('title', 'Title (as is)');
        const _Title = field('Title', 'Title (capitalize)');
        const _date = field('date', 'Date format from "Date Format" setting');
        const _yyyy = field('yyyy', 'Four digit year');
        const _mm = field('mm', 'One/Two digit month');
        const _dd = field('dd', 'One/Two digit day');
        const _rating5 = field('rating5', 'Based on rating with 5 stars');
        const _rating10 = field('rating10', 'Based on rating with 10 stars');
        const _rating100 = field('rating100', 'Based on decimal rating');
        const _performer = field('performer', 'Performer');
        const _tag = field('tag', 'Tag');
        const _gallery = field('gallery', 'Gallery (placeholder)');
        const _studio = field('studio', 'Studio (if multiple studio fields are declared, will set the last one)');
        const _index = field('index', 'Scene group index');
        const _group = field('group', 'Group (if multiple group fields are declared, will set the last one)');

        // Combined fields
        const _last = field('last:...', 'Set the last field until reach the last one');
        const _and = field('&...', 'Enable checking multiple value in one field based on "Multiple Delimiters" (only for {tag} and {performer})');

        card.append(_i, _I, _d, _ext, _title, _Title, _date, _yyyy, _mm, _dd, _rating5, _rating10, _rating100, _performer, _tag, _gallery, _studio, _index, _group, _last, _and);

        fieldsContainer.append(title, show, card);
        return fieldsContainer;
    };

    async function GUIParser() {
        const parserContainer = sk.ui.make.container({
            flex: true,
            style: {
                'flex-direction': 'column',
                width: '100%',
                'justify-content': 'flex-start',
                'align-items': 'flex-start'
            }
        });
        const title = sk.ui.make.title({
            id: 'skExtra_Metadata_Parser_Progress',
            text: 'Parser'
        });

        const card = sk.ui.make.container({
            flex: true,
            style: {
                width: '100%',
                'flex-direction': 'column',
                'align-items': 'flex-start'
            }
        });

        // Search
        const searchContainer = sk.ui.make.container({ flex: true });
        const notOrganizedScenes = sk.ui.make.button({
            text: 'Scenes - not organized',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchParserData('scenes')
            }
        });
        const alsoOrganizedScenes = sk.ui.make.button({
            text: 'Scenes - all',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchParserData('scenes', true)
            }
        });
        const notOrganizedImages = sk.ui.make.button({
            text: 'Images - not organized',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchParserData('images')
            }
        });
        const alsoOrganizedImages = sk.ui.make.button({
            text: 'Images - all',
            class: 'btn btn-secondary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: () => searchParserData('images', true)
            }
        });
        const saveCurrentSettings = sk.ui.make.button({
            text: 'Save current settings',
            class: 'btn btn-primary',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: async() => {
                    newSettings = {};
                    sk.tool.getAll('.skExtra_Metadata_Parser_CurrentSettings').forEach(field => newSettings[field.id().split('skExtra_Metadata_Parser_')[1]] = field.attribute('type') === 'checkbox' ? field.element.checked : field.value());      
                    await sk.plugin.update({
                        name: pluginName,
                        options: newSettings
                    });
                }
            }
        });
        const updateParsed = sk.ui.make.button({
            text: 'Update selected parsed data',
            class: 'btn btn-danger',
            style: { 'margin-right': '.5rem' },
            event: {
                type: 'click',
                callback: updateSelectedParsedData
            }
        });
        const selectAllParsed = sk.ui.make.button({
            text: 'Select all parsed data',
            class: 'btn btn-success',
            event: {
                type: 'click',
                callback: () => sk.tool.getAll('.skExtra_Metadata_Parser_ResultsRow').forEach(row => row.click())
            }
        });
        searchContainer.append(notOrganizedScenes, alsoOrganizedScenes, notOrganizedImages, alsoOrganizedImages, saveCurrentSettings, updateParsed, selectAllParsed);

        // Results
        const resultsContainer = sk.ui.make.container({
            id: 'skExtra_Metadata_Parser_Results',
            style: {
                width: '100%',
                display: 'grid'
            }
        });
        const resultsHeader = sk.ui.make.container({
            class: 'bg-dark',
            flex: true,
            style: {
                width: '100%',
                'margin-top': '1rem',
                'justify-content': 'space-around'
            }
        });
        const fixedWidth = { width: '150px' };
        const resultsId = sk.ui.make.subTitle({
            text: 'Id',
            style: fixedWidth
        });
        const resultsTitle = sk.ui.make.subTitle({
            text: 'Title',
            style: fixedWidth
        });
        const resultsDate = sk.ui.make.subTitle({
            text: 'Date',
            style: fixedWidth
        });
        const resultsRating = sk.ui.make.subTitle({
            text: 'Rating',
            style: fixedWidth
        });
        const resultsPerformers = sk.ui.make.subTitle({
            text: 'Performer/s',
            style: fixedWidth
        });
        const resultsTags = sk.ui.make.subTitle({
            text: 'Tag/s',
            style: fixedWidth
        });
        const resultsStudio = sk.ui.make.subTitle({
            text: 'Studio/s',
            style: fixedWidth
        });
        const resultsIndex = sk.ui.make.subTitle({
            text: 'Index',
            style: fixedWidth
        });
        const resultsGroups = sk.ui.make.subTitle({
            text: 'Group/s',
            style: fixedWidth
        });

        resultsHeader.append(resultsId, resultsTitle, resultsDate, resultsRating, resultsPerformers, resultsTags, resultsStudio, resultsIndex, resultsGroups);
        resultsContainer.append(resultsHeader);

        card.append(searchContainer, resultsContainer);

        parserContainer.append(title, card);
        return parserContainer;
    };

    async function searchParserData(category, includeOrganized) {
        const progress = sk.tool.get('#skExtra_Metadata_Parser_Progress');
        const resultsContainer = sk.tool.get('#skExtra_Metadata_Parser_Results');
        const resultsHeader = resultsContainer.child()[0];
        resultsContainer.write('', true);
        resultsContainer.append(resultsHeader);

        progress.write('Parser - Loading...');
        const path = category === 'scenes' ? 'files {path}' : 'visual_files {... on VideoFile {path} ... on ImageFile {path}}';
        let data = await sk.stash.find[category]({fields: `id organized ${path}`});
        if (!includeOrganized) data = data.filter(entry => !entry.organized);
        progress.write(`Parser - Parsing 0/${data.length} ${category}`);
        sk.tool.notify(pluginName, `Parsing ${data.length} ${category}`);

        createMissingData = false;
        customSettings = {};
        sk.tool.getAll('.skExtra_Metadata_Parser_CurrentSettings').forEach(field => customSettings[field.id().split('skExtra_Metadata_Parser_')[1]] = field.attribute('type') === 'checkbox' ? field.element.checked : field.value());        

        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            const parsedData = await stashIdToName(await getParsedMetadata(entry, category));

            const row = sk.ui.make.container({
                class: 'btn-danger skExtra_Metadata_Parser_ResultsRow',
                flex: true,
                style: {
                    width: '100%',
                    padding: '1rem 0',
                    cursor: 'pointer',
                    'justify-content': 'space-around',
                    'border-top': '.25rem solid rgba(0,0,0,0.1)'
                },
                event: {
                    type: 'click',
                    callback: () => checkParserData(entry, row)
                }
            });
            const fixedWidth = { width: '150px' };
            const resultsId = sk.ui.make.description({
                text: entry.id,
                style: fixedWidth,
                event: {
                    type: 'click',
                    callback: () => window.open(`${window.location.origin}/${category}/${entry.id}`, '_blank').focus()
                }
            });
            const resultsTitle = sk.ui.make.description({
                text: parsedData.title || '',
                style: fixedWidth
            });
            const resultsDate = sk.ui.make.description({
                text: parsedData.date || '',
                style: fixedWidth
            });
            const resultsRating = sk.ui.make.description({
                text: parsedData.rating100 || '',
                style: fixedWidth
            });
            const resultsPerformers = sk.ui.make.description({
                text: `Find: ${parsedData._performers || ''}\nCreate: ${whatWillCreate.performer || ''}`,
                style: fixedWidth
            });
            const resultsTags = sk.ui.make.description({
                text: `Find: ${parsedData._tags || ''}\nCreate: ${whatWillCreate.tag || ''}`,
                style: fixedWidth
            });
            const resultsStudio = sk.ui.make.description({
                text: `Find: ${parsedData._studio || ''}\nCreate: ${whatWillCreate.studio || ''}`,
                style: fixedWidth
            });
            const resultsIndex = sk.ui.make.description({
                text: parsedData.groups ? parsedData.groups[parsedData.groups.length - 1].scene_index || '' : '',
                style: fixedWidth
            });
            const resultsGroups = sk.ui.make.description({
                text: `Find: ${parsedData._groups || ''}\nCreate: ${whatWillCreate.group || ''}`,
                style: fixedWidth
            });

            row.append(resultsId, resultsTitle, resultsDate, resultsRating, resultsPerformers, resultsTags, resultsStudio, resultsIndex, resultsGroups);
            resultsContainer.append(row);
            progress.write(`Parser - Parsing ${i + 1}/${data.length} ${category}`);
            checkParserData(entry, row, category);
        };

        customSettings = undefined;
        whatWillCreate = {};
        progress.write('Parser - Parsing completed');
        sk.tool.notify(pluginName, 'Parsing completed', 'success');
    };

    async function getParsedMetadata(data, category) {
        let path = data?.files || data?.visual_files;
        if (!path) return;
        path = path[0].path.split('\\');
        const file = [path.pop()];
        path.shift(); // Remove drive letter

        let metadata, pathMetadata, fileMetadata;

        const { parsePath, parseFile } = customSettings || sk.plugin.get(pluginName);
        if (parsePath) pathMetadata = await parseMetadata(path, 'path', category);
        if (parseFile) fileMetadata = await parseMetadata(file, 'file', category)
        if (pathMetadata || fileMeta) metadata = { ...pathMetadata, ...fileMetadata };
        if (metadata) {
            if (metadata.groups && metadata._index !== undefined) {
                metadata.groups[metadata.groups.length - 1].scene_index = metadata._index;
                delete metadata._index;
            };
            metadata.id = data.id;
            return metadata;
        };
        return;
    };

    async function parseMetadata(path, type, category) {
        const settings = customSettings || sk.plugin.get(pluginName);
        const exceptions = JSON.parse(sessionStorage.getItem(pluginName))[`${type}Exception`] || [];
        category = category[0].toUpperCase() + category.slice(1).slice(0, -1).toLowerCase();
        const generalParser = type === 'path' ? settings.pathParser : settings[`file${category}Parser`];
        const parser = getExceptionParser(path, exceptions, generalParser);
        if (!parser[0]) return;

        const ignoredWords = settings.ignoredWords.split(' ');
        let parsed, lastField;

        for (let index = 0; index < path.length; index++) {
            const parserPart = parser[index] || parser[lastField.index - 1];
            let currentPath = path[index];
            if (!currentPath) return;

            let fields = parserPart.match(/{(.*?)}/g).map(field => field.slice(1, -1)); // Remove {}
            
            if (fields.includes('i')) ignoredWords.forEach(word => currentPath.replaceAll(new RegExp(word, 'gi'), ''));
            if (fields.includes('I')) ignoredWords.forEach(word => currentPath.replaceAll(new RegExp(word, 'g'), ''));
            if (fields.includes('ext')) currentPath = currentPath.split('.').slice(0, -1).join('.');
            if (fields.includes('d')) currentPath = currentPath.split(/[._-]/g);
            if (!Array.isArray(currentPath)) currentPath = [currentPath];

            fields = fields.filter(field => !['i', 'I', 'ext', 'd'].includes(field) ? field : null);

            if (currentPath.length !== fields.length) return;

            for (let i = 0; i < currentPath.length; i++) {
                let field = fields[i];
                const part = currentPath[i];

                if (field.includes('last:')) {
                    let temp = field.split('last:');
                    lastField = { field: temp[1], index: index };
                    field = path.length === parser.length ? lastField.field : parser[index - 1].match(/{(.*?)}/g).map(b => b.slice(1, -1));
                };
                const value = await parseField(field, part, parsed);
                parsed = { ...parsed, ...value };
            };
        };

        if (parsed.yyyy) {
            parsed.date = parsed.yyyy;
            if (parsed.mm) {
                parsed.date += `-${parsed.mm}`;
                if (parsed.dd) parsed.date += `-${parsed.dd}`;
            };
            delete parsed.yyyy;
            delete parsed.mm;
            delete parsed.dd;
        };
        return parsed;
    };

    function getExceptionParser(path, exceptions, generalParser) {
        if (exceptions[0] === '') return generalParser.split('/');

        let matched = {
            parser: generalParser,
            match: 0
        };
        exceptions.forEach((exception) => {
            let match = 0;
            let newParser = '';
            exception.split('/').forEach((part, i) => {
                const word = part.split(':')[0];
                if (word === path[i]) {
                    match++;
                    newParser += i === 0 ? part : `/${part}`;
                    newParser = newParser.replace(`${word}:`, '');
                };
                if (newParser !== '' && word !== path[i]) newParser += `/${part}`;
            });

            if (match > matched.match) matched = { parser: newParser, match: match };
        });
        return matched.parser.split('/');
    }; 

    async function parseField(field, value, parsed) {
        let { whitespace, multipleDelimiters } = customSettings || sk.plugin.get(pluginName);
        whitespace = whitespace.split(' ');
        multipleDelimiters = multipleDelimiters.replaceAll(' ', '|');

        let result = {};
        let multi = field.includes('&:');
        value = value.trim();

        if (Array.isArray(field)) field = field[0];
        if (multi) field.split('&:')[1];
        if (field.toLowerCase() === 'title') whitespace[0] !== '' ? whitespace.forEach(w => value = value.replaceAll(w, ' ')) : null;
        if (field === 'title') result.title = value;
        if (field === 'Title') result.title = value[0].toUpperCase() + value.slice(1).toLowerCase();
        if (field === 'date') result.date = formatStashDate(value);
        if (field === 'yyyy' || field === 'mm' || field === 'dd') result[field] = value;
        if (field === 'rating5') result.rating100 = value * 20;
        if (field === 'rating10') result.rating100 = value * 10;
        if (field === 'rating100') result.rating100 = value;
        if (field === 'tag' || field === 'performer') result[`${field}_ids`] = multi ? await getStashData(field, value.split(new RegExp(multipleDelimiters, 'g'))) : await getStashData(field, [value]);
        if (field === 'studio') result.studio_id = await getStashData(field, [value]);
        if (field === 'group') {
            let parentGroup;
            result.groups = [];
            if (!parsed.groups) parsed.groups = [];
            if (parsed.groups.length > 0) parentGroup = parsed.groups[parsed.groups.length - 1].group_id;
            const group = await getStashData(field, [value], parentGroup);
            result.groups = result.groups.concat(parsed.groups);
            result.groups.push(group);
        };
        if (field === 'index') result._index = value;
        return result;
    };

    function formatStashDate(date) {
        let customDate = customSettings || sk.plugin.get(pluginName).dateFormat.toLowerCase();
        if (custom === 'yyyy-mm-dd') return;

        customDate = custom.split('-');
        date = date.split('-');
        let stashDate = '';
        const yyyy = customDate[custom.indexOf('yyyy')];
        const mm = customDate[custom.indexOf('mm')];
        const dd = customDate[custom.indexOf('dd')];
        if (yyyy) stashDate += yyyy;
        if (yyyy && mm) stashDate += `-${mm}`;
        if (yyyy && mm && dd) stashDate += `-${dd}`;
        return stashDate;
    };

    async function getStashData(category, data, parentGroup) {
        const { create } = customSettings || sk.plugin.get(pluginName);
        whatWillCreate[category] = '';
        let ids = [];
        for (name of data) {
            let id;
            const options = { filter: { q: name }, fields: 'id' };
            const exist = await sk.stash.find[category](options);

            if (!exist && !createMissingData) whatWillCreate[category] += `${name}, `;

            if (!exist && create && createMissingData) {
                const created = category === 'group' && parentGroup !== undefined ? await sk.stash.create[category]({ name: name, containing_groups: [{ group_id: parentGroup }] }) : await sk.stash.create[category]({ name: name });
                id = created.id;
            };

            if (exist) id = exist.id;
            if (id !== undefined) ids.push(id);
        };
        if (category === 'studio' && ids[0] === undefined) return '';
        if (category === 'studio') return ids[0];
        if (category === 'group') return { group_id: ids[0] };
        return ids;
    };

    async function stashIdToName(data) {
        if (data.performer_ids) {
            const performers = await sk.stash.find.performers({
                ids: data.performer_ids.filter(performer => performer),
                fields: 'name'
            });
            data._performers = performers.map(performer => performer.name).join(', ');
        };

        if (data.tag_ids) {
            const tags = await sk.stash.find.tags({
                ids: data.tag_ids.filter(tag => tag),
                fields: 'name'
            });
            data._tags = tags.map(tag => tag.name).join(', ');
        };

        if (data.studio_id) {
            const studio = await sk.stash.find.studio({
                ids: data.studio_id,
                fields: 'name'
            });
            data._studio = studio.name
        };

        if (data.groups) {
            const groups = await sk.stash.find.groups({
                ids: data.groups.filter(group => group.group_id ? group : null).map(group => group.group_id),
                fields: 'name'
            });
            data._groups = groups.map(group => group.name).join(', ');
        };
        return data;
    };

    function checkParserData(data, row, category) {
        if (!selectedParserData) selectedParserData = {
            toUpdate: [],
            ids: [],
            _category: category.toLowerCase()
        };

        if (selectedParserData.ids.includes(data.id)) {
            const index = selectedParserData.ids.indexOf(data.id);
            selectedParserData.toUpdate.splice(index, 1);
            selectedParserData.ids.splice(index, 1);
            row.class(['btn-success', 'btn-danger']);
        } else {
            selectedParserData.toUpdate.push(data);
            selectedParserData.ids.push(data.id);
            row.class(['btn-danger', 'btn-success']);
        };
    };

    async function updateSelectedParsedData() {
        const progress = sk.tool.get('#skExtra_Metadata_Parser_Progress');
        progress.write(`Parser - Updating 0/${selectedParserData.toUpdate.length} ${selectedScraperData._category}`);

        createMissingData = true;
        customSettings = {};
        sk.tool.getAll('.skExtra_Metadata_Parser_CurrentSettings').forEach(field => customSettings[field.id().split('skExtra_Metadata_Parser_')[1]] = field.attribute('type') === 'checkbox' ? field.element.checked : field.value());

        for (let i = 0; i < selectedParserData.toUpdate.length; i++) {
            const entry = selectedParserData.toUpdate[i];
            let parsedData = await getParsedMetadata(entry, selectedParserData._category);
            parsedData.id = entry.id;
            await sk.stash.update[selectedParserData._category.slice(0, -1)](parsedData);
            progress.write(`Parser - Updating ${i + 1}/${selectedParserData.toUpdate.length} ${selectedScraperData._category}`);
        };

        progress.write('Parser - Updating completed');
    };

    async function parseNoGUI(category, includeOrganized) {
        const path = category === 'scenes' ? 'files {path}' : 'visual_files {... on VideoFile {path} ... on ImageFile {path}}';
        let data = await sk.stash.find[category]({ fields: `id organized ${path}` });
        if (!includeOrganized) data = data.filter(entry => !entry.organized);
        sk.tool.notify(pluginName, `Parsing ${data.length} ${category}`);

        for (const entry of data) {
            let parsedData = await getParsedMetadata(entry, category);
            parsedData.id = entry.id;
            await sk.stash.update[selectedParserData._category.slice(0, -1)](parsedData);
        };

        sk.tool.notify(pluginName, `Updating ${category} completed`);
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            callback: parserGUI,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                },
                {
                    version: '2.0',
                    description: 'Added compatibility to skManager.\nAdded a GUI for easy use.'
                }
            ]
        });
    };

    function skKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k m p g',
                    action: 'Open the metadata parser GUI',
                    callback: parserGUI
                },
                {
                    sequence: 'esc',
                    action: 'Close the metadata parser GUI',
                    callback: () => sk.tool.get('#skExtra_Metadata_Parser_GUI').remove(),
                    selector: '#skExtra_Metadata_Parser_GUI'
                }
            ]
        });
    };

    initialize();
})()