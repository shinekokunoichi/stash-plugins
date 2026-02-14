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
        if (!randomCategory && !activeRandom) activeRandom = skMPI[i].split(':')[0];
        return skMPI[i].split(':')[0];
    };

    //Creation
    async function create() {
        if (sk.tool.get('#skMPIGUI')) return;
        const details = sk.ui.get.performerDetails();
        let skMPI = details.getCustomField('skExtra-Multiple-Performer-Images') || '';
        skMPI = skMPI.toLowerCase().split('|');
        //Dots
        if (skMPI.length > 0) {
            let defaultDot;
            let activeDefault = true;
            let dotList = skMPI.filter((value) => {if (value !== '') return value });
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
                    style: { margin: '10% 0' ,background: 'rgba(0,0,0,.75)', 'min-width': '15px', 'min-height': '15px', border: 'rgba(0,0,0,0) 2px solid', cursor: 'pointer', 'border-radius': '100%' }, class: 'skMPID', event: {
                        type: 'click', callback: () => {
                            sk.tool.getAll('.skMPID').forEach(entry => { entry.style({ 'border-color': 'rgba(0,0,0,0)' }) });
                            details.image.url(preload.url());
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
        if (!thumbnails) thumbnails = await sk.stash.find.images({ fieldFilter: { performers: { modifier: 'INCLUDES', value: [details.id] } }, fields: 'id paths{thumbnail}' });
        let selected;
        const gui = sk.ui.make.button({
            text: 'Set custom images', id: 'skMPIGUI', class: 'btn btn-secondary', event: {
                type: 'click', callback: async () => {
                    const popUp = sk.ui.make.popUp({ style: { background: 'rgba(0,0,0,.9)', top: 0, width: '100%', height: '100%', overflow: 'scroll' } });
                    const info = sk.ui.make.title({ text: 'Click first a type and then the image to set' });
                    const current = sk.ui.make.subTitle();
                    const buttons = sk.ui.make.container({ flex: true, style: { 'flex-wrap': 'wrap' } });
                    const names = settings.preset.includes(',') ? settings.preset.split(',') : settings.preset.split(' ');
                    names.concat(['remove', 'close']).forEach((type) => {
                        type = type.trim();
                        type = type[0].toUpperCase() + type.slice(1).toLowerCase();
                        let buttonType;
                        if (type === 'Remove') buttonType = 'danger';
                        if (type === 'Close') buttonType = 'primary';
                        if (!buttonType) buttonType = 'secondary'
                        const button = sk.ui.make.button({
                            text: type, class: `btn btn-${buttonType}`, style: { margin: '.5%' }, event: {
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
                    const container = sk.ui.make.container({ flex: true, style: { 'flex-wrap': 'wrap' } });
                    thumbnails.forEach((thumbnail) => {
                        const overlay = sk.ui.make.container({ style: { margin: '.5%' } });
                        const setted = sk.ui.make.subTitle();
                        const isSetted = skMPI.filter((value) => { if (value.split(':')[1] === thumbnail.id) return thumbnail; });
                        if (isSetted[0]) {
                            setted.write(isSetted.map((value) => value.split(':')[0]).join(', '));
                            setted.class('skMPIS');
                        };
                        const preview = sk.ui.make.container({
                            style: { cursor: 'pointer', background: `url(${thumbnail.paths.thumbnail}) no-repeat top center`, 'background-size': 'cover', 'min-width': '150px', 'min-height': '150px' }, event: {
                                type: 'click', callback: async () => {
                                    if (!selected) return;
                                    if (selected !== 'remove') {
                                        if (setted.read().includes(selected)) return;
                                        if (skMPI.join('|').includes(selected)) skMPI = skMPI.filter((value) => { if (value.split(':')[0] !== selected) return value; });
                                        const newValue = `${selected}:${thumbnail.id}`;
                                        skMPI.push(newValue);
                                        setted.read().includes(',') ? setted.write(`${setted.read()}, ${selected}`) : setted.write(selected);
                                    };
                                    if (selected === 'remove') skMPI.splice(skMPI.indexOf(value), 1);
                                    await sk.stash.update.performer({ id: details.id, custom_fields: { partial: { skExtra_Multiple_Performer_Images: skMPI.join('|') } } });
                                    sk.tool.getAll('.skMPIS').forEach((entry) => { if (entry.read().includes(selected)) entry.read().includes(',') ? entry.write(entry.read().replace(`${selected}, `)) : entry.write(''); });
                                }
                            }
                        });
                        overlay.append([setted, preview]);
                        container.append(overlay);
                        popUp.append([info, current, buttons, container]);
                        document.body.appendChild(popUp.element);
                    });
                }
            }
        });
        details.buttons.append(gui);
        sk.tool.wait('#performer-page', create, true);
    };

    async function preloadImages() {
        if (images) return;
        images = {};
        const performers = await sk.stash.find.performers({ fieldFilter: { custom_fields: { modifier: 'NOT_NULL', field:"'skExtra_Multiple_Performer_Images'"} }, fields:'id custom_fields image_path'});
        for (performer of performers) {
            const skMPI = performer.custom_fields.skExtra_Multiple_Performer_Images.toLowerCase();
            const list = skMPI.split('|').filter((value) => { if (value !== '') return value });
            if (!list.toString().includes('default')) list.unshift(`default:${performer.image_path.replace(window.location.origin, '')}`);
            const toGet = defaultCategory() ? defaultCategory() : randomize(list);
            let id = list.filter((value) => { if (value.split(':')[0] === toGet) return value; })[0];
            if (id === undefined) return;
            id = id.split(':')[1];
            if (isNaN(id)) return;
            const img = await sk.stash.find.image({ filter: { q: id }, fields: 'paths{image thumbnail}' });
            const preloadImg = sk.ui.make.image({ url: img.paths.image });
            const preloadThumb = sk.ui.make.image({ url: img.paths.thumbnail });
            images[performer.id] = { image: preloadImg.url(), thumbnail: preloadThumb.url() };
        };
        loaded = true;
    };

    async function replace(selector) {
        if (replaced) return;
        if (!loaded) {
            setTimeout(() => { replace(selector); }, 1000);
            return;
        };
        sk.tool.getAll(selector).forEach((card) => {
            if (selector === '.performer-card') card = card.get('a');
            const id = card.url().replace('/performers/', '');
            if (!images[id]) return;
            const url = selector === '.performer-card' ? images[id].image : images[id].thumbnail;
            card.get('img').url(url);
        });
        replaced = true;
    };

    async function main() {
        const defaultSettings = {
            name: pluginName,
            options: {
                preset: 'portrait clothed skimpy nude',
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
        if (settings.replaceAll && settings.default !== 'default') {
            preloadImages();
            sk.tool.wait('.performer-card', () => { replace('.performer-card'); });
            sk.tool.wait('.performer-tag', () => { replace('.performer-tag'); });
        };
        sk.tool.wait('#performer-page', create, true);
    };

    main();
})();