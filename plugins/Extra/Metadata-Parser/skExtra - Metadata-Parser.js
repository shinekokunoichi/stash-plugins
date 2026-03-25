(() => {
    const pluginName = 'skExtra - Metadata-Parser';
    const rule = JSON.parse(sessionStorage.getItem(pluginName));
    let settings;

    function getDate(date) {
        let custom = settings.dateFormat.toLowerCase();
        if (typeof date === 'string' && custom === 'yyyy-mm-dd') return;
        custom = custom.split('-');
        date = date.split('-');
        let stashDate = '';
        const yyyy = date[custom.indexOf('yyyy')];
        const mm = date[custom.indexOf('mm')];
        const dd = date[custom.indexOf('dd')];
        if (yyyy) stashDate += yyyy;
        if (mm) stashDate += `-${mm}`;
        if (dd) stashDate += `-${dd}`;
        return stashDate;
    };

    async function create(category, data, parentGroup) {
        let ids = [];
        for (name of data) {
            let id;
            const options = { filter: { q: name }, fields: 'id' };
            const exist = await sk.stash.find[category](options);
            if (!exist && settings.create) {
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

    async function parseField(field, value, parsed) {
        const meta = ['title', 'Title', 'date', 'yyyy', 'mm', 'dd', 'rating5', 'rating10', 'rating100', 'performer', 'tag', 'studio', 'index', 'group']
        let result = {};
        value = value.trim();
        if (!field.includes('&:') && !meta.includes(field)) return;
        const whitespace = settings.whitespace.split(' ');
        const multiD = settings.multipleDelimiters.replaceAll(' ', '|');
        let multi = field.includes('&:');
        if (multi) field.split('&:')[1];
        if (field.toLowerCase() === 'title') whitespace[0] !== '' ? whitespace.forEach(w => value = value.replaceAll(w, ' ')) : null;
        if (field === 'title') result.title = value;
        if (field === 'Title') result.title = value[0].toUpperCase() + value.slice(1).toLowerCase();
        if (field === 'date') result.date = getDate(value);
        if (field === 'yyyy' || field === 'mm' || field === 'dd') result[field] = value;
        if (field === 'rating5') result.rating100 = value * 20;
        if (field === 'rating10') result.rating100 = value * 10;
        if (field === 'rating100') result.rating100 = value;
        if (field === 'tag' || field === 'performer') result[`${field}_ids`] = multi ? await create(field, value.split(new RegExp(multiD, 'g'))) : await create(field, [value]);
        if (field === 'studio') result.studio_id = await create(field, [value]);
        if (field === 'group') {
            let parentGroup;
            result.groups = [];
            if (!parsed.groups) parsed.groups = [];
            if (parsed.groups.length > 0) parentGroup = parsed.groups[parsed.groups.length - 1].group_id;
            const group = await create(field, [value], parentGroup);
            result.groups = result.groups.concat(parsed.groups);
            result.groups.push(group);
        };
        if (field === 'index') result._index = value;
        return result;
    };

    function getException(path, exceptions, general) {
        if (exceptions[0] === '') return general.split('/');
        let matched = {
            parser: general,
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

    async function parseMetadata(path, type, category) {
        const exceptions = rule[`${type}Exception`] || [];
        category = category[0].toUpperCase() + category.slice(1).toLowerCase();
        const general = type === 'path' ? settings.pathParser : settings[`file${category}Parser`];
        const parser = getException(path, exceptions, general);
        if (parser[0] === '') return;
        const ignored = settings.ignoredWords.split(' ');
        let canParse = true;
        let parsed, last;
        for (let index = 0; index < path.length; index++) {
            const part = parser[index] || parser[last.index - 1];
            let current = path[index];
            if (!canParse || !current) return;
            const fields = part.match(/{(.*?)}/g).map(field => field.slice(1, -1));
            if (fields.includes('i')) {
                ignored.forEach(word => current.replaceAll(new RegExp(word, 'gi'), ''));
                fields.forEach((field) => { if (field === 'i') fields.splice(fields.indexOf(field, 1)); });
            };
            if (fields.includes('I')) {
                ignored.forEach(word => current.replaceAll(new RegExp(word, 'g'), ''));
                fields.forEach((field) => { if (field === 'I') fields.splice(fields.indexOf(field, 1)); });
            };
            if (fields.includes('ext')) {
                let temp = current.split('.');
                temp.splice(temp.length - 1, 1);
                current = temp.join('.');
                fields.forEach((field) => { if (field === 'ext') fields.splice(fields.indexOf(field, 1)); });
            };
            if (fields.includes('d')) {
                fields.forEach((field) => { if (field === 'd') fields.splice(fields.indexOf(field), 1); });
                current = current.split(/[._-]/g);
                if (current.length !== fields.length) canParse = false;
                if (!canParse) return;
                for (let i = 0; i < current.length; i++) {
                    const value = await parseField(fields[i], current[i], parsed);
                    parsed = { ...parsed, ...value };
                };
            } else if (!fields.includes('d')) {
                let field = fields[0];
                if (field.includes('last:')) {
                    let temp = field.split('last:');
                    last = { field: temp[1], index: index };
                    field = path.length === parser.length ? last.field : parser[index - 1].match(/{(.*?)}/g).map(f => f.slice(1, -1));
                };
                const value = await parseField(field, current, parsed);
                parsed = { ...parsed, ...value };
            };
        };
        if (parsed.yyyy) {
            parsed.date = parsed.yyyy;
            if (parsed.mm) parsed.date += `-${parsed.mm}`;
            if (parsed.dd) parsed.date += `-${parsed.dd}`;
            delete parsed.yyyy;
            delete parsed.mm;
            delete parsed.dd;
        };
        return parsed;
    };

    async function start(category, id) {
        const field = category === 'scene' ? 'files' : 'visual_files';
        const data = await sk.stash.find[category](`${id}`);
        if (!data[field] || !data[field][0]) return;
        const path = data[field][0].path.split('\\');
        const file = [path.pop()];
        path.shift();
        let metadata, pathMeta, fileMeta;
        if (settings.parsePath) pathMeta = await parseMetadata(path, 'path', category);
        if (settings.parseFile) fileMeta = await parseMetadata(file, 'file', category)
        if (pathMeta || fileMeta) metadata = { ...pathMeta, ...fileMeta };
        if (metadata) {
            if (metadata.groups && metadata._index !== undefined) {
                metadata.groups[metadata.groups.length - 1].scene_index = metadata._index;
                delete metadata._index;
            };
            metadata.id = id;
            await sk.stash.update[category](metadata);
            return metadata;
        };
        return false;
    };

    async function parseAll(type) {
        if (type === 'all' || type === 'scene') {
            let scenes = await sk.stash.find.scenes({ fields: 'id organized' });
            scenes = scenes.filter((scene) => { if (!scene.organized) return scene; });
            sk.tool.notify(pluginName, `Parsing ${scenes.length} scenes`);
            let sceneDone = 0;
            for (scene of scenes) {
                const sceneParsed = await start('scene', scene.id);
                if (sceneParsed) sceneDone++;
            };
            sk.tool.notify(pluginName, `Finished parsing scenes: parsed ${sceneDone} of ${scenes.length}`);
        };
        if (type === 'all' || type === 'image') {
            let images = await sk.stash.find.images({ fields: 'id organized' });
            images = images.filter((image) => { if (!image.organized) return image; });
            sk.tool.notify(pluginName, `Parsing ${images.length} images`);
            let imageDone = 0;
            for (image of images) {
                const imageParsed = image.organized ? await start('image', image.id) : null;
                if (imageParsed) imageDone++;
            };
            sk.tool.notify(pluginName, `Finished parsing images: parsed ${imageDone} of ${images.length}`);
        };

    };

    async function main() {
        const defaultSettings = {
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
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        sk.task.add([
            { id: pluginName, name: 'Parse All', description: 'Parse all scenes and images (not organized)', callback: parseAll, arg: 'all' },
            { id: pluginName, name: 'Parse Scenes', description: 'Parse all scene (not organized)', callback: parseAll, arg: 'scene' },
            { id: pluginName, name: 'Parse Images', description: 'Parse all image (not organized)', callback: parseAll, arg: 'image' }
        ]);
    };

    main();
})()