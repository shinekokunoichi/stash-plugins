(() => {
    const pluginName = 'skExtra - Multiple-Performer-Images';
    let activeRandom, preloadedImages, gui, newPresetsList, isRemoving, replaced;

    async function initialize() {
        await setDefaultSettings();
        await preloadImages();

        sk.tool.wait(sk.ui.is.performerPage, async () => {
            await createDots();
            await createGUI();
        }, true);

        if (sk.plugin.get(pluginName).replaceAll)  {
            sk.tool.wait(sk.ui.is.performerCard, () => { replacePerformersImage(sk.ui.is.performerCard); });
            sk.tool.wait('.performer-tag', () => { replacePerformersImage('.performer-tag'); });
        };

        sk.tool.wait('.filtered-list-toolbar', performersPresetChange);

        ['create', 'update', 'destroy'].forEach(operation => sk.hook.add({
            category: 'image',
            operation: operation,
            callback: () => thumbnails = undefined
        }));
    };

    async function setDefaultSettings() {
        // Remove me next update
        const currentSettings = sk.plugin.get(pluginName);

        const defaultSettings = {
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
        };
        await sk.plugin.check(defaultSettings);
    };

    async function createDots() {
        if (sk.tool.get('.skExtra_Multiple_Performer_Images_Dot')) return;

        const performer = sk.ui.get.page.performer();
        let performerImages = await performer.getCustomField(pluginName) || '';
        performerImages = performerImages.split('|').filter(value => value);
        performerImages.unshift(`default:${performer.image.url().replace(window.location.origin, '')}`);

        const dotsContainer = sk.ui.make.container({
            flex: true,
            style: { 'flex-direction': 'column' }
        });

        const preset = presetToShow(performerImages).split(':')[0];
        for (const value of performerImages) {
            const [type, id] = value.split(':');

            if (type && id !== undefined) {
                let url;
                if (type === 'default') {
                    url = id;
                } else {
                    url = await sk.stash.find.image({
                        ids: [id],
                        fields: 'paths {image}'
                    });
                    url = url.paths.image;
                };
                const image = sk.ui.make.image({ url: url });
                const dot = sk.ui.make.container({
                    style: {
                        margin: '10% 0',
                        background: 'rgba(0, 0, 0, .75)',
                        'min-width': '15px',
                        'min-height': '15px',
                        border: 'rgba(0, 0, 0, 0) 2px solid',
                        cursor: 'pointer',
                        'border-radius': '100%'
                    },
                    attribute: { title: type },
                    class: 'skExtra_Multiple_Performer_Images_Dot',
                    event: {
                        type: 'click',
                        callback: () => {
                            const previousDot = sk.tool.get('.skExtra_Multiple_Performer_Images_Dot.active');
                            if (previousDot) {
                                previousDot.class('active');
                                previousDot.style({ 'border-color': 'rgba(0, 0, 0, 0)' });
                            };
                            performer.image.url(image.url());
                            dot.class('active');
                            dot.style({ 'border-color': 'white' });
                        }
                    }
                });
                if (type === preset) dot.click();
                dotsContainer.append(dot);
            }
        };
        performer.headers.append(dotsContainer);
        if (!sk.tool.get('.skExtra_Multiple_Performer_Images_Dot.active')) dotsContainer.child()[0].click();
    };

    function presetToShow(availablePresets) {
        const { useDefault, defaultCategory, useSFW, sfwCategory, presets, randomCategory } = sk.plugin.get(pluginName);
        const sfwMode = sk.stash.configuration().interface.sfwContentMode;

        if (useDefault && !(useSFW && sfwMode)) return defaultCategory;
        if (useDefault && (useSFW && sfwMode)) return sfwCategory;

        const getRandomIndex = (list) => Math.floor(Math.random() * list.length);
        if (availablePresets) return availablePresets[getRandomIndex(availablePresets)].trim();
        if (!activeRandom || randomCategory) activeRandom = presets[getRandomIndex(presets.split(','))].trim();

        return activeRandom;
    };

    async function createGUI() {
        if (sk.tool.get('#skExtra_Multiple_Performer_Images_Open')) return;

        const performer = sk.ui.get.page.performer();
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
                    gui.append([info, current, buttons, previews]);

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
        optionsContainer.append([tagFilter, squareRatio, portraitRatio, landscapeRatio]);

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
                        if (isRemoving) {
                            editRemovePreset(button);
                            return;
                        };
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

        toolsContainer.append([newPreset, removeImage, closeGUI])

        gui._buttons.append([optionsContainer, presetsContainer, toolsContainer]);
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
            card.append([settedPresets, preview]);
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
        debugger

        await sk.stash.update.performer({
            id: performer.id,
            custom_fields: {
                partial: { [pluginName]: orderedPresets.join('|') }
            }
        });

        sk.tool.getAll('.skExtra_Multiple_Performer_Images_Subtitle').forEach((entry) => { if (entry.read().includes(preset) && settedPresets.read() !== entry.read()) entry.read().includes(',') ? entry.write(preset.read().replace(`${preset}, `, '')) : entry.write(''); });
    };

    async function preloadImages() {
        preloadedImages = {};
        const performers = await sk.stash.find.performers({
            fieldFilter: {
                custom_fields: {
                    modifier: 'NOT_NULL',
                    field: `'${pluginName}'`
                }
            },
            fields: 'id custom_fields image_path'
        });

        for (const performer of performers) {
            preloadedImages[performer.id] = {
                Default: {
                    image: performer.image_path,
                    thumbnail: performer.image_path.replace('image', 'thumbnail')
                }
            };
            const performerImages = performer.custom_fields[pluginName].split('|').filter(value => value);
            preloadedImages[performer.id]._all = performerImages.concat('Default');
            for (const value of performerImages) {
                const [ preset, id ] = value.split(':');
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
    };

    function replacePerformersImage(selector, preset) {
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

    function performersPresetChange() {
        if (window.location.pathname !== '/performers' || sk.tool.get('.skExtra_Multiple_Performer_Image_Fast_Preset')) return;
        const container = sk.ui.make.container({
            flex: true,
            style: { 'flex-wrap': 'wrap' }
        });
        const presets = sk.plugin.get(pluginName).presets.split(',');

        ['Default'].concat(presets).forEach((preset) => {
            const button = sk.ui.make.button({
                class: 'btn btn-secondary skExtra_Multiple_Performer_Image_Fast_Preset',
                text: preset,
                event: {
                    type: 'click',
                    callback: () => {
                        const latest = sk.tool.get('.skExtra_Multiple_Performer_Image_Fast_Preset.active');
                        if (latest) latest.class('active');
                        button.class('active');
                        replacePerformersImage(sk.ui.is.performerCard, preset);
                    }
                }
            });
            container.append(button);
        });

        const filterBar = sk.tool.get('.filtered-list-toolbar').element;
        filterBar.parentNode.insertBefore(container.element, filterBar.nextSibling);
    };

    initialize();
})()