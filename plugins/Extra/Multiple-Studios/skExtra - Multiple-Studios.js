(() => {
    const pluginName = 'skExtra - Multiple-Studios';
    let studios, awesomplete;

    async function initialize() {
        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
    };

    // Watcher
    function setWatcher() {
        sk.tool.wait('div[data-field="studio_id"]', createOtherStudios, true);
        sk.tool.wait(sk.ui.is.studioPage, createExtraImagesTab, true);
    };

    async function createOtherStudios() {
        if (sk.tool.get('#skExtra_Multiple_Studios_Input')) return;

        if (!studios) studios = await sk.stash.find.studios({ fields: 'id name image_path custom_fields' });

        createFormGroup();
        showSettedStudios();
        saveOtherStudios();
    };

    function createFormGroup() {
        const div = sk.ui.make.container({
            id: 'skExtra_Multiple_Studios_Input',
            class: 'form-group row',
            attribute: { 'data-field': 'skExtra_Multiple_Studios_Input' }
        });
        const label = sk.element('label', {
            text: 'Other studios',
            class: 'form-label col-form-label col-sm-3',
            attribute: { for: 'skExtra_Multiple_Studios_Input' }
        });
        const inputContainer = sk.ui.make.container({ class: 'col-sm-9' });
        const input = createAwesompleteInput();

        inputContainer.append(input);
        div.append(label, inputContainer);

        sk.tool.get('div[data-field="studio_id"]').element.after(div.element);
    };

    function createAwesompleteInput() {
        const group = sk.ui.make.container({
            id: 'skExtra_Multiple_Studios_Select',
            class: 'autocomplete-container',
            style: { 'text-align': 'center' }
        });
        const input = sk.ui.make.input({
            id: 'global-search-autocomplete',
            class: 'form-control awesomplete',
            attribute: { placeholder: 'Studio name' },
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
                    sk.tool.get('#skExtra_Multiple_Studios_Others').append(createStudioBadge(id));
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
        const find = studios.filter(studio => studio.name.toLowerCase().includes(input.value().toLowerCase()));
        const toShow = find.map(studio => `${studio.id}|${studio.name}|${studio.image_path}`);
        awesomplete.list = toShow;
    };

    async function showSettedStudios() {
        const page = sk.ui.get.page.image();
        const otherStudios = await page.getCustomField(pluginName);

        const div = sk.ui.make.container({ class: 'row react-select__control css-13cymwt-control' });
        const flex = sk.ui.make.container({
            id: 'skExtra_Multiple_Studios_Others',
            class: 'react-select__value-container react-select__value-container--is-multi react-select__value-container--has-value css-1dyz3mf'
        });

        if (otherStudios.includes('|')) otherStudios.split('|').forEach(studio => studio ? flex.append(createStudioBadge(studio)) : null);

        div.append(flex);

        sk.tool.get('#skExtra_Multiple_Studios_Input').element.after(div.element);
    };

    function createStudioBadge(id) {
        const studio = studios.filter(entry => entry.id == id.trim())[0];

        const container = sk.ui.make.container({ class: 'react-select__multi-value css-1p3m7a8-multiValue' });
        const name = sk.ui.make.container({
            class: 'react-select__multi-value__label css-9jq23d',
            text: studio.name,
            attribute: { _id: id }
        });

        const remove = sk.ui.make.container({
            class: 'react-select__multi-value__remove css-1h0qd4',
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

    async function saveOtherStudios() {
        sk.tool.get('.edit-button.btn.btn-primary').event({
            type: 'click',
            callback: () => {
                const page = sk.ui.get.page.image();
                let newData = '';

                sk.tool.get('#skExtra_Multiple_Studios_Others').child().forEach(badge => {
                    const studioId = badge.child()[0].attribute('_id');
                    newData += `${studioId}|`;

                    const studio = studios.filter(entry => entry.id == studioId)[0];
                    let studioExtraImages = studio.custom_fields[pluginName];
                    
                    if (!studioExtraImages) studioExtraImages = '';
                    if (studioExtraImages.split('|').includes(page.id)) return;

                    sk.stash.update.studio({
                        id: studioId,
                        custom_fields: {
                            partial: { [pluginName]: `${studioExtraImages}|${page.id}` }
                        }
                    })
                });

                sk.stash.update.image({
                    id: page.id,
                    custom_fields: {
                        partial: { [pluginName]: newData }
                    }
                });
            }
        })
    };

    async function createExtraImagesTab() {
        if (sk.tool.get('#skExtra_Multiple_Studios_Tab Images')) return;

        const page = sk.ui.get.page.studio();
        const section = page.navbar.add('Other Images');

        const badge = sk.element('span', { class: 'left-spacing badge badge-pill badge-secondary' });
        sk.tool.get('[id="skPPT_Other Images"]').append(badge);

        const container = sk.ui.make.container({
            id: 'skExtra_Multiple_Studios_Tab',
            flex: true,
            style: {
                'flex-direction': 'row',
                'flex-wrap': 'wrap'
            }
        });

        const otherImages = await page.getCustomField(pluginName);

        let imagesNumber = 0;

        for (const image of otherImages.split('|')) {
            if (image) {
                container.append(await createImageCard(image));
                imagesNumber++;
            };
        };

        if (imagesNumber > 0) badge.write(imagesNumber);

        section.append(container);
    };

    async function createImageCard(id) {
        const image = await sk.stash.find.image(id);

        const card = sk.ui.make.container({
            class: 'card',
            style: { cursor: 'pointer' },
            event: {
                type: 'click',
                callback: () => window.open(`${window.location.origin}/images/${id}`, '_blank')
            }
        });
   
        const preview = sk.ui.make.image({
            url: image.paths.thumbnail,
            style: {
                'max-width': '20rem',
                'max-height': '20rem',
            },
        });
        const title = sk.ui.make.subTitle({ text: image.title });

        card.append(preview, title);
        return card;
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
})()