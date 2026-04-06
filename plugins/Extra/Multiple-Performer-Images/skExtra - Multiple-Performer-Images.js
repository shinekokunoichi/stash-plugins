(() => {
    const pluginName = 'skExtra - Multiple-Performer-Images';
    let settings, thumbnails, images, loaded, replaced, activeRandom;

    //Tool
    function defaultCategory() {
        let category;
        const sfw = settings.useSFW && sk.stash.configuration().interface.sfwContentMode;
        const useDefault = settings.useDefault;
        if (useDefault && !sfw) category = settings.default;
        if (useDefault && sfw) category = settings.sfwCategory;
        return category;
    };

    function randomize(skMPI, once) {
        let randomCategory = settings.randomCategory;
        if (once) randomCategory = true;
        let i;
        if (randomCategory || !randomCategory && !activeRandom) i = Math.floor(Math.random() * skMPI.length);
        if (!randomCategory && activeRandom) return activeRandom;
        if (!randomCategory && !activeRandom) activeRandom = skMPI[i].split(':')[0]
        return skMPI[i].split(':')[0];
    };

    //Creation
    async function create() {
        if (sk.tool.get('#skExtra_Multiple_Performer_Image_Open')) return;
        const details = sk.ui.get.page.performer();
        let skMPI = await details.getCustomField('skExtra-Multiple-Performer-Images') || '';
        skMPI = skMPI.toLowerCase().split('|');
        //Dots
        if (skMPI.length > 0) {
            let defaultDot;
            let activeDefault = true;
            let dotList = skMPI.filter((value) => { if (value !== '') return value });
            if (!dotList.toString().includes('default')) dotList.unshift(`default:${details.image.url().replace(window.location.origin, '')}`);
            const toGet = defaultCategory() ? defaultCategory() : randomize(dotList, true);
            const dotContainer = sk.ui.make.container({ flex: true, style: { 'flex-direction': 'column' } });
            for (value of dotList) {
                const [type, id] = value.split(':');
                if (!type || id === undefined) return;
                if (type === 'default') url = id;
                if (type !== 'default') {
                    url = await sk.stash.find.image({ ids: [id], fields: 'paths {image}' });
                    url = url.paths.image;
                };
                const preload = sk.ui.make.image({ url: url });
                const dot = sk.ui.make.container({
                    style: { margin: '10% 0', background: 'rgba(0,0,0,.75)', 'min-width': '15px', 'min-height': '15px', border: 'rgba(0,0,0,0) 2px solid', cursor: 'pointer', 'border-radius': '100%' }, class: 'skExtra_Multiple_Performer_Image_Dot', event: {
                        type: 'click', callback: () => {
                            sk.tool.getAll('.skExtra_Multiple_Performer_Image_Dot').forEach(entry => {
                                entry.style({ 'border-color': 'rgba(0,0,0,0)' });
                                if (entry.class().includes('active')) entry.class('active');
                            });
                            details.image.url(preload.url());
                            dot.class('active');
                            dot.style({ 'border-color': 'white' });
                        }
                    }
                });
                if (type === 'default') defaultDot = dot;
                if (type === toGet) {
                    dot.click();
                    activeDefault = false;
                };
                dotContainer.append(dot);
                details.headers.append(dotContainer);
            };
            if (activeDefault) defaultDot.click();
        };
        //GUI
        if (!thumbnails) thumbnails = await sk.stash.find.images({ fieldFilter: { performers: { modifier: 'INCLUDES', value: [details.id] } }, fields: 'id paths{thumbnail} tags{name aliases}' });
        let selected;
        const gui = sk.ui.make.button({
            text: 'Set custom images', id: 'skExtra_Multiple_Performer_Image_Open', class: 'btn btn-secondary', event: {
                type: 'click', callback: async () => {
                    //Overlay
                    const popUp = sk.ui.make.popUp({ id: 'skExtra_Multiple_Performer_Image_UI' ,style: { background: 'rgba(0,0,0,.9)', top: 0, width: '100%', height: '100%', overflow: 'scroll' } });
                    const info = sk.ui.make.title({ text: 'Click first a type and then the image to set' });
                    const current = sk.ui.make.subTitle();
                    const buttons = sk.ui.make.container({ flex: true, style: { 'flex-wrap': 'wrap' } });
                    const toolButtons = sk.ui.make.container({ flex: true, style: { 'flex-wrap': 'wrap' } });
                    const names = settings.preset.split(',');
                    //Tag Filter
                    const tagFilter = sk.ui.make.input({ class: 'text-input', attribute: { placeholder: 'Tag filter' }, event: { type: 'input', callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Image_Thumbnail').forEach(e => e.attribute('_tags').includes(tagFilter.value()) || tagFilter.value() === '' ? e.style({ display: 'block' }) : e.style({ display: 'none' })) } });
                    //Aspect Ratio
                    const squareRatio = sk.ui.make.button({ text: 'Square', class: 'btn btn-success', style: { margin: '.5%' }, event: { type: 'click', callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Image_Thumbnail').forEach(e => e.style({ 'min-width': '150px', 'min-height': '150px' })) } });
                    const portraitRatio = sk.ui.make.button({ text: 'Portrait', class: 'btn btn-success', style: { margin: '.5%' }, event: { type: 'click', callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Image_Thumbnail').forEach(e => e.style({ 'min-width': '150px', 'min-height': '300px' })) } });
                    const landscapeRatio = sk.ui.make.button({ text: 'Landscape', class: 'btn btn-success', style: { margin: '.5%' }, event: { type: 'click', callback: () => sk.tool.getAll('.skExtra_Multiple_Performer_Image_Thumbnail').forEach(e => e.style({ 'min-width': '300px', 'min-height': '150px' })) } });
                    //Tool buttons
                    toolButtons.append([tagFilter, squareRatio, portraitRatio, landscapeRatio]);
                    //Category buttons
                    names.concat(['remove', 'close']).forEach((type) => {
                        type = type.trim();
                        type = type[0].toUpperCase() + type.slice(1).toLowerCase();
                        let buttonType;
                        if (type === 'Remove') buttonType = 'danger';
                        if (type === 'Close' || skMPI.toString().includes(type.toLowerCase())) buttonType = 'primary';
                        if (!buttonType) buttonType = 'secondary'
                        const button = sk.ui.make.button({
                            id: `skExtra_Multiple_Performer_Image_Subtitle-${type.replaceAll(' ','_')}`, text: type, class: `btn btn-${buttonType}`, style: { margin: '.5%' }, event: {
                                type: 'click', callback: () => {
                                    if (type === 'Close') popUp.remove();
                                    if (type !== 'Close') {
                                        if (type.toLowerCase() === 'custom') type = window.prompt('Custom name');
                                        type = type.toLowerCase();
                                        selected = type;
                                        current.write(`Selecting image for ${type}`);
                                    };
                                }
                            }
                        });
                        buttons.append(button);
                    });
                    //Thumbnails
                    const container = sk.ui.make.container({ flex: true, style: { 'flex-wrap': 'wrap' } });
                    thumbnails.forEach((thumbnail) => {
                        const overlay = sk.ui.make.container({ style: { margin: '.5%' } });
                        const setted = sk.ui.make.subTitle({ class: 'skExtra_Multiple_Performer_Image_Subtitle' });
                        const isSetted = skMPI.filter((value) => { if (value.split(':')[1] === thumbnail.id) return thumbnail; });
                        if (isSetted[0]) {
                            setted.write(isSetted.map((value) => {
                                let categoryName = value.split(':')[0];
                                categoryName = categoryName[0].toUpperCase() + categoryName.slice(1).toLowerCase();
                                return categoryName;
                            })).join(', ');
                        };
                        let tags = '';
                        thumbnail.tags.forEach((tag) => {
                            if (tag.name) tags = tags === '' ? tag.name.toLowerCase() : `${tags} tag.name.toLowerCase()`;
                            if (tag.aliases[0]) tags += ` ${tag.aliases.join(' ').toLowerCase()}`;
                        });
                        const preview = sk.ui.make.container({
                            class: 'skExtra_Multiple_Performer_Image_Thumbnail', attribute: { _tags: tags },style: { cursor: 'pointer', background: `url(${thumbnail.paths.thumbnail}) no-repeat top center`, 'background-size': 'cover', 'min-width': '150px', 'min-height': '150px' }, event: {
                                type: 'click', callback: async () => {
                                    if (!selected) return;
                                    if (selected !== 'remove') {
                                        //Add a new category
                                        if (setted.read().includes(selected)) return;
                                        if (skMPI.join('|').includes(selected)) skMPI = skMPI.filter((value) => { if (value.split(':')[0] !== selected) return value; });
                                        const newValue = `${selected}:${thumbnail.id}`;
                                        skMPI.push(newValue);
                                        const uSelected = selected[0].toUpperCase() + selected.slice(1).toLowerCase();
                                        setted.read().includes(',') ? setted.write(`${setted.read()}, ${uSelected}`) : setted.write(uSelected);
                                        sk.tool.get(`#skExtra_Multiple_Performer_Image_Subtitle-${uSelected.replaceAll(' ', '_') }`).class('btn btn-primary', true);
                                    };
                                    //Remove the category
                                    if (selected === 'remove') {
                                        let newSettedText = setted.read().split(', ');
                                        let toRemove = newSettedText[newSettedText.length - 1];
                                        toRemove = toRemove[0].toUpperCase() + toRemove.slice(1).toLowerCase();
                                        skMPI = skMPI.filter((value) => { if (value.split(':')[0] !== toRemove.toLowerCase()) return value; });
                                        sk.tool.get(`#skExtra_Multiple_Performer_Image_Subtitle-${toRemove}`).class('btn btn-secondary', true);
                                        newSettedText.pop();
                                        setted.write(newSettedText);
                                    };
                                    //Update
                                    await sk.stash.update.performer({ id: details.id, custom_fields: { partial: { skExtra_Multiple_Performer_Images: skMPI.join('|') } } });
                                    sk.tool.getAll('.skExtra_Multiple_Performer_Image_Subtitle').forEach((entry) => { if (entry.read().includes(selected)) entry.read().includes(',') ? entry.write(entry.read().replace(`${selected}, `)) : entry.write(''); });
                                }
                            }
                        });
                        overlay.append([setted, preview]);
                        container.append(overlay);
                        popUp.append([info, current, buttons, toolButtons, container]);
                        document.body.appendChild(popUp.element);
                    });
                }
            }
        })
        details.buttons.append(gui);
        sk.tool.wait('#performer-page', create, true);
    };

    async function preloadImages() {
        if (images) return;
        images = {};
        const performers = await sk.stash.find.performers({ fieldFilter: { custom_fields: { modifier: 'NOT_NULL', field: "'skExtra_Multiple_Performer_Images'" } }, fields: 'id custom_fields image_path' });
        for (performer of performers) {
            const skMPI = performer.custom_fields.skExtra_Multiple_Performer_Images.toLowerCase();
            const list = skMPI.split('|').filter((value) => { if (value !== '') return value });
            if (!list.toString().includes('default')) list.unshift(`default:${performer.image_path.replace(window.location.origin, '')}`);
            const toGet = defaultCategory() ? defaultCategory() : randomize(list);
            let ids = list.filter((value) => { if (!value.includes('default')) return value });
            images[performer.id] = {
                default: {
                    image: performer.image_path,
                    thumbnail: performer.image_path.replace('image?', 'thumbnail?')
                }
            };
            ids.forEach((el) => {
                const [category, id] = el.split(':');
                if (images[performer.id][category] === undefined) images[performer.id][category] = id;
            });
            for (preset in images[performer.id]) {
                if (preset !== 'default') {
                    const img = await sk.stash.find.image({ filter: { q: images[performer.id][preset] }, fields: 'paths{image thumbnail}' });
                    const preloadImg = sk.ui.make.image({ url: img.paths.image });
                    const preloadThumb = sk.ui.make.image({ url: img.paths.thumbnail });
                    images[performer.id][preset] = { image: preloadImg.url(), thumbnail: preloadThumb.url() };
                };
            };
        };
        loaded = true;
    };

    async function replace(selector, toGet) {
        if (replaced && !toGet) return;
        if (!loaded) {
            setTimeout(() => { replace(selector); }, 200);
            return;
        };
        sk.tool.getAll(selector).forEach((card) => {
            const skMPI = performer.custom_fields.skExtra_Multiple_Performer_Images.toLowerCase();
            const list = skMPI.split('|').filter((value) => { if (value !== '') return value });
            if (!toGet) toGet = defaultCategory() ? defaultCategory() : randomize(list);
            if (selector === '.performer-card') card = card.get('a');
            const id = card.url().replace('/performers/', '');
            if (!images[id]) return;
            if (!images[id][toGet]) return;
            const url = selector === '.performer-card' ? images[id][toGet].image : images[id][toGet].thumbnail;
            card.get('img').url(url);
        });
        replaced = true;
    };

    function fastChange() {
        if (window.location.pathname !== '/performers') return;
        const container = sk.ui.make.container({ flex: true, style: {'flex-wrap':'wrap'} });
        const names = settings.preset.split(',');
        ['default'].concat(names).forEach((preset) => {
            const button = sk.ui.make.button({ class: 'btn btn-secondary', text: preset, event: { type: 'click', callback: () => { replace(sk.ui.is.performerCard, preset) } } });
            container.append(button);
        });

        const filterBar = sk.tool.get('.filtered-list-toolbar').element;
        filterBar.parentNode.insertBefore(container.element, filterBar.nextSibling);
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                preset: 'portrait, clothed, skimpy, nude',
                useDefault: true,
                default: 'skimpy',
                randomCategory: true,
                replaceAll: true,
                useSFW: true,
                sfwCategory: 'clothed'
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = sk.plugin.get(pluginName);
        if (settings.preset === 'portrait clothed skimpy nude') await sk.plugin.update({ name: pluginName, options: { preset: 'portrait, clothed, skimpy, nude' } }); //Adapt to the new settings
        if (settings.replaceAll && settings.default !== 'default') {
            preloadImages();
            sk.tool.wait('.filtered-list-toolbar', fastChange, true)
            sk.tool.wait(sk.ui.is.performerCard, () => { replace(sk.ui.is.performerCard); });
            sk.tool.wait('.performer-tag', () => { replace('.performer-tag'); });
        };
        sk.tool.wait(sk.ui.is.performerPage, create, true);
    };

    main();

    if (window._skUI_Theme) window._skUI_Theme.load(pluginName, {
        General: {
            UI: { selector: '#skExtra_Multiple_Performer_Image_UI' },
            Dot: { selector: '.skExtra_Multiple_Performer_Image_Dot' },
            'Active dot': { selector: '.skExtra_Multiple_Performer_Image_Dot.active' }
        }
    });
})();