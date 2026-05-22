(() => {
    const pluginName = 'skExtra - Multiple-Performer-Images';
    const { React, patch, components } = PluginApi;
    let activeRandom, preloadedImages, gui, newPresetsList, removingPreset;

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Patcher
        patchPerformerDetails();
        patchPerformerPage();

        // Watcher
        setWatcher();

        // Hooks
        setHooks();

        // Compatibility
        skManagerCompatibility();
        skKeybinderCompatibility();
        skThemeCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        // Remove me next update
        const currentSettings = sk.plugin.get(pluginName);
        await sk.plugin.check({
            name: pluginName,
            options: {
                presets: currentSettings.preset || 'Portrait, Clothed, Skimpy, Nude',
                useDefault: true,
                defaultCategory: currentSettings.default || 'Default',
                randomCategory: true,
                replaceAll: true,
                useSFW: true,
                sfwCategory: 'Clothed'
            }
        });
    };

    // Patcher
    function patchPerformerDetails() {
        patch.after('PerformerHeaderImage', (props, _, component) => {
            const [preload, preloaded] = React.useState(preloadedImages?.loaded ? true : false);
            React.useEffect(async () => {
                await preloadImages();
                preloaded(true);
            }, [preload]);
            return preload ? createHeaderImages(props, component) : components.LoadingIndicator({ message: 'loading' });
        });

        patchLightboxView();

        patch.after('PerformerPage', (props, _, component) => {
            const [preload, preloaded] = React.useState(preloadedImages?.loaded ? true : false);
            React.useEffect(async () => {
                await preloadImages();
                preloaded(true);
            }, [preload]);

            createGUI();

            return preload ? createDots(props, component) : components.LoadingIndicator({ message: 'loading' });
        });
        sk.tool.wait('#performer-page .detail-header-image', () => sk.tool.get('.skExtra_Multiple_Performer_Images_Dot.active').click(), true);
    };

    async function preloadImages() {
        if (preloadedImages?._loaded) return;
        preloadedImages = {};

        const performers = await sk.stash.find.performers({ fields: 'id custom_fields image_path' });

        if (!performers) return;

        for (const performer of performers) {
            preloadedImages[performer.id] = {
                Default: {
                    image: performer.image_path,
                    thumbnail: performer.image_path.replace('image', 'thumbnail')
                }
            };

            const performerImages = performer.custom_fields[pluginName]?.split('|')?.filter(value => value) || [];
            preloadedImages[performer.id]._all = performerImages.concat('Default'); // Custom fields for performersPresetChange

            for (const value of performerImages) {
                const [preset, id] = value.split(':');
                const image = await sk.stash.find.image({
                    filter: { q: id },
                    fields: 'paths { image thumbnail }'
                });
                preloadedImages[performer.id][preset] = {
                    image: image.paths.image,
                    thumbnail: image.paths.thumbnail
                };
            };
        };
        preloadedImages._loaded = true;
    };

    function createHeaderImages(props, component) {
        if (props.lightboxImages.length > 1) return component; // Prevent duplication

        let presets = props.performer.custom_fields[pluginName];
        if (!presets) return component;
        for (const preset of presets.split('|')) {
            props.lightboxImages.push({ paths: preloadedImages[props.performer.id][preset.split(':')[0]].image });
        };
        return component;
    };

    function patchLightboxView() {
        sk.tool.wait('#performer-page .detail-header-image', () => {
            sk.tool.get('.detail-header-image .btn-link').event({
                type: 'click',
                callback: () => {
                    const index = Number(sk.tool.get('.skExtra_Multiple_Performer_Images_Dot.active').attribute('_index'));
                    sk.tool.wait('.Lightbox-carousel', () => {
                        sk.tool.get('.Lightbox-carousel').style({ left: `-${index * 100}vw` });
                        const count = sk.tool.get('.Lightbox-header-indicator b');
                        if (!count) return;
                        count.write(`${index + 1} / ${count.read().split('/ ')[1]}`);
                    }, true);
                }
            });
        }, true);
    };

    function createDots(props, component) {
        const performerImages = getPerformerImages(props, component.props.children[1].props.children[1].props.children[0].props.activeImage);
        const dots = [];
        const preset = presetToShow(performerImages).split(':')[0];

        // Dots creation
        for (let i = 0; i < performerImages.length; i++) {
            const value = performerImages[i];
            const [type, id] = value.split(':');
            if (preloadedImages[props.performer.id]) {
                if (type) url = preloadedImages[props.performer.id][type].image;
                if (url) dots.push(createDot(type, preset, url, i));
            };
        };

        const performerHeader = component.props.children[1].props.children[1].props.children[1].props.children;
        performerHeader.props.children.push(React.createElement(
            'div',
            { className: 'row' },
            ...dots
        ));

        return component;
    };

    function getPerformerImages(props, defaultURL) {
        let performerImages = props.performer.custom_fields[pluginName] || '';
        performerImages = performerImages.split('|').filter(value => value);
        performerImages.unshift(`Default:${defaultURL.replace(window.location.origin, '')}`);
        return performerImages;
    };

    function presetToShow(availablePresets) {
        const { useDefault, defaultCategory, useSFW, sfwCategory, presets, randomCategory } = sk.plugin.get(pluginName);
        const sfwMode = sk.stash.configuration().interface.sfwContentMode;

        // Default
        if (useDefault && !(useSFW && sfwMode)) return defaultCategory;
        if (useDefault && (useSFW && sfwMode)) return sfwCategory;

        // Random
        const getRandomIndex = (list) => Math.floor(Math.random() * list.length);
        if (availablePresets) return availablePresets[getRandomIndex(availablePresets)].trim();
        if (!activeRandom || randomCategory) activeRandom = presets[getRandomIndex(presets.split(','))].trim();

        return activeRandom;
    };

    function createDot(type, preset, image, index) {
        const isActive = type === preset ? 'active' : '';
        return React.createElement(
            'div',
            {
                title: type,
                _index: index,
                className: `skExtra_Multiple_Performer_Images_Dot ${isActive}`,
                onClick: (event) => {
                    const previousDot = sk.tool.get('.skExtra_Multiple_Performer_Images_Dot.active');
                    if (previousDot) previousDot.class('active');
                    event.target.classList.add('active');
                    sk.ui.get.page.performer().image.url(image);
                }
            }
        );
    };

    async function createGUI() {
        if (sk.tool.get('#skExtra_Multiple_Performer_Images_Open')) return;

        const performer = sk.ui.get.page.performer();
        if (!performer.buttons) {
            setTimeout(createGUI, 100);
            return;
        };

        const openGUI = sk.ui.make.button({
            text: 'Set custom images',
            id: 'skExtra_Multiple_Performer_Images_Open',
            class: 'btn btn-secondary',
            event: {
                type: 'click',
                callback: async () => {
                    gui = sk.ui.make.popUp({
                        id: 'skExtra_Multiple_Performer_Images_UI',
                        style: {
                            background: 'rgba(0, 0, 0, .9)',
                            top: 0, width: '100%',
                            height: '100%',
                            overflow: 'scroll'
                        }
                    });
                    const info = sk.ui.make.title({ text: 'Click first a type and then the image to set' });
                    const current = sk.ui.make.subTitle();
                    const buttons = sk.ui.make.container({
                        flex: true,
                        style: { 'flex-wrap': 'wrap' }
                    });
                    const previews = sk.ui.make.container({
                        flex: true,
                        style: { 'flex-wrap': 'wrap' }
                    });

                    gui._current = current;
                    gui._buttons = buttons;
                    gui._previews = previews;
                    gui.append(info, current, buttons, previews);

                    await GUIButtons();
                    await GUIPreviews();

                    document.body.appendChild(gui.element);
                }
            }
        });
        performer.buttons.append(openGUI);
    };

    async function GUIButtons(forceAdd = []) {
        const performer = sk.ui.get.page.performer();
        const performerImages = await performer.getCustomField(pluginName) || '';
        const performerPresets = performerImages.split('|').map(value => value.split(':')[0].toLowerCase());

        if (gui._buttons) gui._buttons.write('', true);
        const optionsContainer = sk.ui.make.container({
            flex: true,
            style: {
                width: '100%',
                'flex-wrap': 'wrap'
            }
        });

        const tagFilter = sk.ui.make.input({
            class: 'text-input',
            attribute: { placeholder: 'Tag filter' },
            event: {
                type: 'input',
                callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Images_Thumbnail').forEach(e => e.attribute('_tags').toLowerCase().includes(tagFilter.value().toLowerCase()) || tagFilter.value() === '' ? e.style({ display: 'block' }) : e.style({ display: 'none' }))
            }
        });
        const squareRatio = sk.ui.make.button({
            text: 'Square',
            class: 'btn btn-success',
            style: { margin: '.5%' },
            event: {
                type: 'click',
                callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Images_Thumbnail').forEach(e => e.style({ 'min-width': '150px', 'min-height': '150px' }))
            }
        });
        const portraitRatio = sk.ui.make.button({
            text: 'Portrait',
            class: 'btn btn-success',
            style: { margin: '.5%' },
            event: {
                type: 'click',
                callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Images_Thumbnail').forEach(e => e.style({ 'min-width': '150px', 'min-height': '300px' }))
            }
        });
        const landscapeRatio = sk.ui.make.button({
            text: 'Landscape',
            class: 'btn btn-success',
            style: { margin: '.5%' },
            event: {
                type: 'click',
                callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Images_Thumbnail').forEach(e => e.style({ 'min-width': '300px', 'min-height': '150px' }))
            }
        });
        optionsContainer.append(tagFilter, squareRatio, portraitRatio, landscapeRatio);

        const presetsContainer = sk.ui.make.container({
            flex: true,
            style: {
                width: '100%',
                'flex-wrap': 'wrap'
            }
        });
        const { presets } = sk.plugin.get(pluginName);

        presets.split(',').concat(forceAdd).forEach((preset) => {
            if (!preset) return;
            preset = preset.trim();

            const button = sk.ui.make.button({
                text: preset,
                class: 'btn btn-secondary skExtra_Multiple_Performer_Images_Preset',
                attribute: { _preset: preset },
                style: { margin: '.5%' },
                event: {
                    type: 'click',
                    callback: () => {
                        button.class('active');
                        gui._current.write(`Selecting image for ${preset}`);
                    }
                }
            });
            if (forceAdd[0] && preset === forceAdd[forceAdd.length - 1]) button.click();
            presetsContainer.append(button);
        });

        const toolsContainer = sk.ui.make.container({
            flex: true,
            style: {
                width: '100%',
                'flex-wrap': 'wrap'
            }
        });

        const newPreset = sk.ui.make.button({
            text: 'New preset',
            class: `btn btn-success skExtra_Multiple_Performer_Images_Preset`,
            style: { margin: '.5%' },
            event: {
                type: 'click',
                callback: editNewPreset
            }
        });

        const removeImage = sk.ui.make.button({
            text: 'Remove image',
            class: `btn btn-danger skExtra_Multiple_Performer_Images_Preset`,
            style: { margin: '.5%' },
            event: {
                type: 'click',
                callback: () => {
                    removeImage.class('active');
                    gui._current.write('Click the image to remove presets');
                }
            }
        });

        const closeGUI = sk.ui.make.button({
            text: 'Close',
            class: `btn btn-primary skExtra_Multiple_Performer_Images_Preset`,
            style: { margin: '.5%' },
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        });

        toolsContainer.append(newPreset, removeImage, closeGUI)

        gui._buttons.append(optionsContainer, presetsContainer, toolsContainer);
    };

    async function editNewPreset() {
        const presets = sk.plugin.get(pluginName).presets;
        const preset = window.prompt('New preset name');

        if (!presets.includes(preset) || !newPresetsList.includes(preset)) {
            newPresetsList = !newPresetsList ? preset : `${newPresetsList}, ${preset}`;
            const newPresets = !presets ? newPresetsList : `${presets}, ${newPresetsList}`;
            await sk.plugin.update({
                name: pluginName,
                options: { presets: newPresets }
            });
            sk.stash.configuration().plugins[pluginName] = newPresets;
            GUIButtons(newPresetsList.split(','));
        };
    };

    async function GUIPreviews() {
        const performer = sk.ui.get.page.performer();
        let performerImages = await performer.getCustomField(pluginName) || '';
        performerImages = performerImages.split('|').filter(value => value);

        const images = await sk.stash.find.images({
            fieldFilter: {
                performers: {
                    modifier: 'INCLUDES',
                    value: [performer.id]
                }
            },
            fields: 'id paths{thumbnail} tags{name aliases}'
        });

        images.forEach((image) => {
            const ownPresets = performerImages.filter(value => value.split(':')[1] === image.id ? image : null);
            let tags = '';
            image.tags.forEach((tag) => {
                if (tag.name) tags = tags === '' ? tag.name : `${tags} ${tag.name}`;
                if (tag.aliases[0]) tags += ` ${tag.aliases.join(' ')}`;
            });

            const card = sk.ui.make.container({
                style: { margin: '.5%' }
            });
            const settedPresets = sk.ui.make.subTitle({
                text: ownPresets.map(value => value.split(':')[0]).join(', '),
                class: 'skExtra_Multiple_Performer_Images_Subtitle'
            });
            const preview = sk.ui.make.container({
                class: 'skExtra_Multiple_Performer_Images_Thumbnail',
                attribute: { _tags: tags },
                style: {
                    cursor: 'pointer',
                    background: `url(${image.paths.thumbnail}) no-repeat top center`,
                    'background-size': 'cover',
                    'min-width': '150px',
                    'min-height': '150px'
                },
                event: {
                    type: 'click',
                    callback: () => { editPreviewPreset(settedPresets, image); }
                }
            });
            card.append(settedPresets, preview);
            gui._previews.append(card);
        });
    };

    async function editPreviewPreset(settedPresets, thumbnail) {
        let activePreset = sk.tool.get('.skExtra_Multiple_Performer_Images_Preset.active');
        if (!activePreset) return;

        const performer = sk.ui.get.page.performer();
        let performerImages = await performer.getCustomField(pluginName) || '';
        performerImages = performerImages.split('|').filter(value => value);

        const preset = activePreset.read();

        if (preset === 'Remove image') {
            if (!settedPresets.read()) return;
            const toRemove = settedPresets.read().split(',');
            performerImages = performerImages.filter(value => !toRemove.includes(value.split(':')[0]) ? value : null);
            sk.tool.getAll('.skExtra_Multiple_Performer_Images_Preset').forEach(el => toRemove.includes(el.read() ? el.class('btn btn-secondary', true) : null));
            settedPresets.write('');
        } else {
            if (settedPresets.read().includes(preset)) return;
            if (performerImages.toString().includes(preset)) performerImages = performerImages.filter((value) => { if (value.split(':')[0] !== preset) return value; });
            performerImages.push(`${preset}:${thumbnail.id}`);
            settedPresets.read().includes(',') ? settedPresets.write(`${settedPresets.read()}, ${preset}`) : settedPresets.write(preset);
            activePreset.class('btn btn-primary', true);
        };

        const presets = sk.plugin.get(pluginName).presets.split(',').map(value => value.trim());
        let orderedPresets = [];
        performerImages.forEach(value => orderedPresets[presets.indexOf(value.split(':')[0].trim())] = value);
        orderedPresets = orderedPresets.filter(value => value);

        await sk.stash.update.performer({
            id: performer.id,
            custom_fields: {
                partial: { [pluginName]: orderedPresets.join('|') }
            }
        });

        sk.tool.getAll('.skExtra_Multiple_Performer_Images_Subtitle').forEach((entry) => { if (entry.read().includes(preset) && settedPresets.read() !== entry.read()) entry.read().includes(',') ? entry.write(preset.read().replace(`${preset}, `, '')) : entry.write(''); });
    };

    function patchPerformerPage() {
        patch.after('PerformerList', (props, _, component) => createPresetChange(props, component));
    };

    function createPresetChange(props, component) {
        const presets = sk.plugin.get(pluginName).presets.split(',');
        const presetsButtons = [];

        ['Default'].concat(presets).forEach(preset => presetsButtons.push(createPresetChangeButton(preset)));

        return React.createElement(
            'div',
            {},
            [
                React.createElement(
                    'div',
                    { className: 'skExtra_Multiple_Performer_Images_Presets' },
                    ...presetsButtons
                ),
                component
            ]
        );
    };

    function createPresetChangeButton(preset) {
        return React.createElement(
            'button',
            {
                className: 'btn btn-secondary skExtra_Multiple_Performer_Image_Fast_Preset',
                onClick: (event) => {
                    const previousButton = sk.tool.get('.skExtra_Multiple_Performer_Image_Fast_Preset.active');
                    if (previousButton) previousButton.class('active');
                    event.target.classList.add('active');
                    replacePerformersImage(sk.ui.is.performerCard, preset);
                }
            },
            preset
        );
    };

    async function replacePerformersImage(selector, preset) {
        if (!preloadedImages) await preloadImages();
        sk.tool.getAll(selector).forEach((element) => {
            if (selector === '.performer-card') element = element.get('a');
            const id = element.url().replace('/performers/', '');
            if (element.attribute('presetChanged') && !preset) return;
            if (!preloadedImages[id]) return;
            if (!preset) preset = presetToShow(preloadedImages[id]._all).split(':')[0];
            preset = preset.trim();
            if (!preloadedImages[id][preset]) return;
            const type = selector === '.performer-card' ? preloadedImages[id][preset].image : preloadedImages[id][preset].thumbnail;
            element.get('img').url(type);
            element.attribute({ presetChanged: 'true' });
        });
    };

    // Watcher
    function setWatcher() {
        if (sk.plugin.get(pluginName).replaceAll) {
            sk.tool.wait(sk.ui.is.performerCard, () => { replacePerformersImage(sk.ui.is.performerCard); }); // Card
            sk.tool.wait('.performer-tag', () => { replacePerformersImage('.performer-tag'); }); // Performer popover
        };
    };

    // Hooks
    function setHooks() {
        // Prevent refresh to load new/changed/deleted images
        ['create', 'update', 'destroy'].forEach(operation => sk.hook.add({
            category: 'image',
            operation: operation,
            callback: () => preloadedImages = undefined
        }));
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            callback: managerGUI,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                },
                {
                    version: '2.0',
                    description: 'Updated code for easy function integration.'
                },
                {
                    version: '3.0',
                    description: 'Fixed problems with TrueNAS.'
                }
            ]
        });
    };

    async function managerGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skExtra_Multiple_Performer_Images_Manager',
            class: 'bg-dark',
            style: {
                width: '100%',
                height: '100%',
                top: 0,
                right: 0,
                'box-shadow': '0 0 5px black',
                'overflow-y': 'auto'
            }
        });

        const performers = await sk.stash.find.performers({ fields: 'id name image_path custom_fields' });
        gui.append(presetManager(performers), performersManager(performers));

        const close = sk.ui.make.button({
            text: 'Close',
            class: 'btn btn-danger',
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        });

        gui.append(close);

        document.body.append(gui.element);
    };

    function presetManager(performers) {
        const section = sk.ui.make.container();
        const title = sk.ui.make.title({ text: 'Presets editor' });

        const { presets } = sk.plugin.get(pluginName);
        let presetsCounter = {};

        performers.forEach((performer) => {
            const settedImages = performer?.custom_fields['skExtra - Multiple-Performer-Images'];
            if (settedImages) settedImages.split('|').forEach(image => presetsCounter[image.split(':')[0]] ? presetsCounter[image.split(':')[0]]++ : presetsCounter[image.split(':')[0]] = 1)
        })

        const presetSection = sk.ui.make.container({
            flex: true,
            style: {
                gap: '1rem',
                'flex-wrap': 'wrap'
            }
        });

        presets.split(',').forEach(preset => presetSection.append(sk.ui.make.button({
            text: `${preset.trim()}: ${presetsCounter[preset.trim()] ? presetsCounter[preset.trim()] : 0}`,
            class: 'btn btn-secondary',
            event: {
                type: 'click',
                callback: () => {
                    if (!removingPreset) return;
                    let newPresets = presets.replace(preset, '');
                    if (newPresets.includes(',,')) newPreset.replace(',,', ',');
                    sk.plugin.update({
                        name: pluginName,
                        options: { presets: newPresets }
                    })
                }
            }
        })));

        const presetEditor = sk.ui.make.container({
            flex: true,
            style: {
                gap: '1rem',
                margin: '2rem 0'
            }
        });
        const presetAdd = sk.ui.make.button({
            text: 'Add',
            class: 'btn btn-success',
            event: {
                type: 'click',
                callback: () => {
                    const newPreset = window.prompt('New preset/s name, separated by comma');
                    if (!newPreset) return;
                    sk.plugin.update({
                        name: pluginName,
                        options: { presets: `${presets}, ${newPreset}` }
                    })
                }
            }
        });
        const presetRemove = sk.ui.make.button({
            text: 'Remove',
            class: 'btn btn-danger',
            event: {
                type: 'click',
                callback: () => {
                    removingPreset = true;
                    title.write('Presets editor: click the preset to remove')
                }
            }
        });
        presetEditor.append(presetAdd, presetRemove);

        section.append(title, presetSection, presetEditor);
        return section;
    };

    function performersManager(performers) {
        const section = sk.ui.make.container();

        const settedSection = sk.ui.make.container();
        const settedTitle = sk.ui.make.title({ text: 'Setted performers' });
        const settedCards = sk.ui.make.container({
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });
        settedSection.append(settedTitle, settedCards);

        const notSettedSection = sk.ui.make.container();
        const notSettedTitle = sk.ui.make.title({ text: 'Not setted performers' });
        const notSettedCards = sk.ui.make.container({
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });
        notSettedSection.append(notSettedTitle, notSettedCards);

        performers.forEach((performer) => {
            const settedImages = performer?.custom_fields['skExtra - Multiple-Performer-Images'];
            settedImages ? settedCards.append(createPerformerCard(performer)) : notSettedCards.append(createPerformerCard(performer));
        })

        section.append(settedSection, notSettedSection);
        return section;
    };

    function createPerformerCard(performer) {
        const card = sk.ui.make.container({
            class: 'card',
            flex: true,
            style: {
                width: '15rem',
                height: '20rem',
                padding: 0,
                'background-image': `url(${performer.image_path})`,
                'background-size': 'cover',
                'background-position': 'center top',
                'justify-content': 'flex-end'
            }
        });

        const infoSection = sk.ui.make.container({ 
            class: 'bg-dark',
            style: { width: '100%' }
        });
        const name = sk.ui.make.link({
            text: performer.name,
            attribute: { target: '_blank' },
            style: { cursor: 'pointer' },
            url: `${window.location.origin}/performers/${performer.id}`
        });
        const ownPresets = sk.ui.make.container({
            flex: true,
            style: { 'justify-content': 'space-around' }
        });
        infoSection.append(name, ownPresets);

        let presetsList = '';
        const settedImages = performer?.custom_fields['skExtra - Multiple-Performer-Images'];
        if (settedImages) ['Default'].concat(settedImages.split('|')).forEach(preset => ownPresets.append(sk.ui.make.description({
            text: preset.split(':')[0],
            style: { cursor: 'pointer' },
            event: {
                type: 'click',
                callback: async () => {
                    let image = preset === 'Default' ? performer.image_path : await sk.stash.find.image(preset.split(':')[1]);
                    if (image.paths) image = image.paths.thumbnail;
                    card.style({ 'background-image': `url(${image})` });
                }
            }
        })));

        card.append(infoSection);
        return card;
    };

    function skKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k m p i g',
                    action: 'Open the multiple performer images GUI',
                    callback: () => sk.tool.get('#skExtra_Multiple_Performer_Images_Open').click()
                },
                {
                    sequence: 'esc',
                    action: 'Close the multiple performer images GUI',
                    callback: () => sk.tool.get('#skExtra_Multiple_Performer_Images_UI').remove(),
                    selector: '#skExtra_Multiple_Performer_Images_UI'
                },
                {
                    sequence: 's k m p i m',
                    action: 'Open the multiple performer images manager',
                    callback: managerGUI
                },
                {
                    sequence: 'esc',
                    action: 'Close the multiple performer images manager',
                    callback: () => sk.tool.get('#skExtra_Multiple_Performer_Images_Manager').remove(),
                    selector: '#skExtra_Multiple_Performer_Images_Manager'
                }
            ]
        });
    };

    function skThemeCompatibility() {
        if (window._skUI_Theme) window._skUI_Theme.load(pluginName, {
            General: {
                GUI: { selector: '#skExtra_Multiple_Performer_Images_UI' },
                Dot: { selector: '.skExtra_Multiple_Performer_Images_Dot' },
                'Active dot': { selector: '.skExtra_Multiple_Performer_Images_Dot.active' },
                'Presets change': { selector: '.skExtra_Multiple_Performer_Images_Presets' }
            }
        });
    };

    initialize();
})()