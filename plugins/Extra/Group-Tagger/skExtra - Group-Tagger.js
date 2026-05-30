(() => {
    const pluginName = 'skExtra - Group-Tagger';
    const { React, patch, components } = PluginApi;
    let preloadedTags, selectedTags, awesomplete;

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Watcher
        setWatcher();

        // Patcher
        setPatcher();

        // Compatibility
        skManagerCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: {
                viewType: 'Nested',
                onlyChild: true
            }
        });
    };

    // Watcher
    function setWatcher() {
        PluginApi.Event.addEventListener("stash:location", () => selectedTags = undefined)
    };

    // Patcher
    function setPatcher() {
        patch.instead('TagSelect', () => {
            const [preload, preloaded] = React.useState(preloadedTags ? true : false);

            React.useEffect(async () => {
                preloadedTags = await sk.stash.find.tags({ fields: 'id name aliases parents{id} child_count parent_count image_path' });
                preloaded(true);

                if (!sk.tool.get('#skExtra_Group_Tagger_Tags')) showSelectedTags();
            }, [preload]);

            const button = React.createElement('div', {
                id: 'skExtra_Group_Tagger_Open',
                className: 'btn btn-secondary',
                onClick: showCustomTagger
            }, 'Open tagger');

            return preload ? button : components.LoadingIndicator({ message: 'loading' });
        });
    };

    function showCustomTagger() {
        const gui = sk.ui.make.popUp({
            class: 'card',
            style: {
                top: '10rem',
                left: '5rem',
                width: '30rem',
                height: '35rem',
                resize: 'both',
                'overflow-y': 'auto',
                'box-shadow': '0 0 .5rem .1rem rgba(0, 0, 0, .75)'
            }
        });
        const move = sk.ui.make.description({
            text: 'Move',
            class: 'btn btn-success',
            style: {
                position: 'fixed',
                padding: '.25rem',
                margin: '-1.5rem',
                cursor: 'move'
            }
        });
        const close = sk.ui.make.description({
            text: 'Close',
            class: 'btn btn-danger',
            style: {
                position: 'fixed',
                padding: '.25rem',
                margin: '-1.5rem 1.5rem'
            },
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        });

        gui.append(move, close);
        gui.append(createAwesompleteInput(), createCategorySelector());
        makeDraggable(gui.element);

        saveSelectedTags();

        document.body.append(gui.element);
    };

    function makeDraggable(element) {
        let cursorPosition = {
            x: 0,
            y: 0
        };

        const draggableEvent = {
            holding: (event) => {
                event.preventDefault();

                cursorPosition.x = event.clientX;
                cursorPosition.y = event.clientY;

                document.onmousemove = draggableEvent.moving;
                document.onmouseup = draggableEvent.released;
            },
            moving: (event) => {
                event.preventDefault();

                if (event.clientX === cursorPosition.x && event.clientY === cursorPosition.y) return;

                cursorPosition.x = event.clientX;
                cursorPosition.y = event.clientY;

                element.style.left = `${cursorPosition.x}px`;
                element.style.top = `${cursorPosition.y}px`;
            },
            released: () => {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        };

        element.children[0].onmousedown = draggableEvent.holding;
    };

    function createAwesompleteInput() {
        const group = sk.ui.make.container({
            id: 'skExtra_Group_Tagger_Search',
            class: 'autocomplete-container',
            style: {
                'text-align': 'center',
                'margin-top': '1rem'
            }
        });
        const input = sk.ui.make.input({
            id: 'global-search-autocomplete',
            class: 'form-control awesomplete',
            attribute: { placeholder: 'Tag name' },
            event: {
                type: 'input',
                callback: () => getResults(input)
            }
        });
        group.append(input);

        awesomplete = new Awesomplete(input.element, {
            minChars: 1,
            maxItems: 10,
            item: (text) => {
                const [id, name, image_path] = text.split('|');

                const li = document.createElement('li');
                li.onclick = () => {
                    sk.tool.get('#skExtra_Group_Tagger_Tags').append(createTagsBadge(id));
                    sk.tool.get('.edit-button.btn.btn-primary').element.disabled = false;
                };

                const img = document.createElement('img');
                img.src = image_path.trim();

                const div = document.createElement('div');
                div.textContent = name.trim();

                li.appendChild(img);
                li.appendChild(div);
                return li;
            },
            replace: (text) => {
                const [id, name] = text.split('|');
                input.value(name.trim());
            },
            filter: () => true
        });
        return group;
    };

    function getResults(input) {
        const searching = input.value().toLowerCase();
        const find = preloadedTags.filter(tag => {
            if (tag.name.toLowerCase().includes(searching)) return tag;

            let find;
            tag.aliases.forEach(alias => alias.toLowerCase().includes(searching) ? find = true : null);
            if (find) return tag;
        });
        const toShow = find.map(tag => `${tag.id}|${tag.name}|${tag.image_path}`);
        awesomplete.list = toShow;
    };

    function createCategorySelector() {
        const section = sk.ui.make.container();

        let tagsSelector = {};

        preloadedTags.forEach(tag => tagsSelector[tag.id] = (createTagSelector(tag)));

        let toRemove = [];

        for (const tag of preloadedTags) {
            const tagSelector = tagsSelector[tag.id];

            tag.parents.forEach(parentTag => {
                tagsSelector[parentTag.id].append(tagSelector);
                toRemove.push(tag.id);
            });
        };

        toRemove.forEach(id => delete tagsSelector[id]);

        for (const id in tagsSelector) {
            section.append(tagsSelector[id]);

            tagsSelector[id].child().forEach(child => child.element.tagName === 'DIV' ? child.style({ display: 'none' }) : null);
        };

        return section;
    };

    function createTagSelector(tag) {
        const { viewType } = sk.plugin.get(pluginName);
        const isNested = viewType.toLowerCase() === 'nested';

        const row = sk.ui.make.container({
            class: 'btn btn-secondary skExtra_Group_Tagger_TagSelector',
            style: {
                cursor: 'pointer',
                margin: '.25rem',
                display: tag.parent_count === 0 ? 'block' : 'inline-block'
            },
            event: {
                type: 'click',
                callback: (event) => activeTagSelector(event, row, tag, isNested)
            }
        });

        const name = sk.ui.make.description({
            text: tag.name,
            style: { margin: 0 }
        });

        if (tag.child_count > 0) {
            const more = sk.ui.make.container({
                text: '...',
                class: 'btn btn-primary',
                style: {
                    display: 'inline',
                    padding: '0 .25rem',
                    'margin-left': '.5rem',
                    'border-radius': '10rem'
                }
            });
            name.append(more)
        };

        if (tag.parent_count > 0) row.style({ display: 'none' });

        row.append(name);

        return row;
    };

    function activeTagSelector(event, row, tag, isNested) {
        const { onlyChild } = sk.plugin.get(pluginName);

        event.stopPropagation();

        const displayType = isNested ? 'inline-block' : 'block';

        row.class('active');

        row.child().forEach(child => {
            if (child.element.tagName === 'DIV') {
                if (!isNested || (isNested && tag.child_count > 0)) child.style('display') === 'none' ? child.style({ display: displayType }) : child.style({ display: 'none' })
            };
        });

        if (onlyChild && tag.child_count > 0 && !event.shiftKey) return;

        if (!selectedTags) selectedTags = [];

        if (selectedTags && selectedTags.indexOf(tag.id) === -1) {
            selectedTags.push(tag.id);
            sk.tool.get('#skExtra_Group_Tagger_Tags').append(createTagsBadge(tag.id));
        }
        else if (selectedTags && selectedTags.indexOf(tag.id) !== -1) {
            selectedTags.splice(selectedTags.indexOf(tag.id), 1);
            sk.tool.get(`#skExtra_Group_Tagger_Tags_${tag.id}`).remove();
        };

        sk.tool.get('.edit-button.btn.btn-primary').element.disabled = false;
    };

    function showSelectedTags() {
        const div = sk.ui.make.container({ class: 'row react-select__control css-13cymwt-control' });
        const flex = sk.ui.make.container({
            id: 'skExtra_Group_Tagger_Tags',
            style: {
                display: 'flex',
                flex: '1 1 0%',
                position: 'relative',
                overflow: 'hidden',
                padding: '2px 8px',
                'box-sizing': 'border-box',
                'align-items': 'center',
                '-webkit-box-align': 'center'
            }
        });

        if (selectedTags) for (const id of selectedTags) flex.append(createTagsBadge(id));

        div.append(flex);
        sk.tool.get('div[data-field="tag_ids"]').element.after(div.element);
    };

    function createTagsBadge(id) {
        const tag = preloadedTags.filter(entry => entry.id == id)[0];

        const container = sk.ui.make.container({
            id: `skExtra_Group_Tagger_Tags_${id}`,
            style: {
                color: '#f5f8fa',
                display: 'flex',
                margin: '2px',
                'background-color': '#bfccd6',
                'min-width': '0px',
                'border-radius': '2px',
                'box-sizing': 'border-box'
            }
        });

        const name = sk.ui.make.container({
            text: tag.name,
            style: {
                color: 'rgb(51, 51, 51)',
                overflow: 'hidden',
                padding: '3px 3px 3px 6px',
                'text-overflow': 'ellipsis',
                'white-space': 'nowrap',
                'font-size': '85%',
                'border-radius': '2px',
                'box-sizing': 'border-box'
            },
            attribute: { _id: id }
        });

        const remove = sk.ui.make.container({
            style: {
                display: 'flex',
                color: 'rgb(51, 51, 51)',
                'padding-left': '4px',
                'padding-right': '4px',
                'border-radius': '2px',
                'box-sizing': 'border-box',
                'align-items': 'center',
                '-webkit-box-align': 'center'
            },
            text: 'x',
            event: {
                type: 'click',
                callback: () => {
                    container.remove();
                    sk.tool.get('.edit-button.btn.btn-primary').element.disabled = false;
                }
            }
        });

        container.append(name, remove);

        return container;
    };

    async function saveSelectedTags() {
        sk.tool.get('.edit-button.btn.btn-primary').event({
            type: 'click',
            callback: () => {
                let category = window.location.pathname.split('/')[1];
                category = category === 'galleries' ? 'gallery' : category.slice(0, -1);

                const page = sk.ui.get.page[category]();
                let ids = [];

                sk.tool.get('#skExtra_Group_Tagger_Tags').child().forEach(badge => ids.push(badge.child()[0].attribute('_id')));

                sk.stash.update[category]({
                    id: page.id,
                    tag_ids: ids
                });
            }
        });
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                }
            ]
        });
    };

    initialize();
})();