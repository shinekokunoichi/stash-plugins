(() => {
    const pluginName = 'skUI - Theme';
    let settings, loaded, ui, liveEdit, tooltip;

    //UI & Live handler

    function updateLiveEdit(plugin, category, element, property, selector, value) {
        if (!liveEdit) liveEdit = {};
        if (!liveEdit[plugin]) liveEdit[plugin] = {};
        if (!liveEdit[plugin][category]) liveEdit[plugin][category] = {};
        if (!liveEdit[plugin][category][element]) liveEdit[plugin][category][element] = {};
        if (!liveEdit[plugin][category][element].selector) liveEdit[plugin][category][element].selector = selector;
        liveEdit[plugin][category][element][property] = value;
    };

    const exceptions = [
        'animation',
        'background-image',
        'background-repeat',
        'background-position',
        'background-attachment',
        'text-align',
        'border-style',
        'border-style-top',
        'border-style-left',
        'border-style-right',
        'border-style-bottom',
        'border-radius',
        'box-shadow',
        'display',
        'fill',
        'filter',
        'flex-direction',
        'flex-wrap',
        'align-content',
        'justify-content',
        'align-items'
    ];

    const cssREM = [
        'font-size',
        'min-width',
        'min-height',
        'max-width',
        'max-height'
    ];

    const cssProperty = {
        'background-color': 'Backgrund color of the element. Use the color picker and the alpha channel slider',
        'background-image': 'Background image. Can be the id of a stash image or file name from "skUI - Assets/Custom/"',
        'background-repeat': 'Repeat the background image if is too small for the element. Values: no-repeat, repeat',
        'background-position': 'Set the background image position. Values: top, left, right, bottom, center. Note you can mix them: x-position y-position, top center',
        'background-attachment': 'Set the background fixed or scrolls with the rest of the page. Values: fixed, scroll',
        'color': 'Text color',
        'font-size': 'Font size',
        'text-align': 'Text alignment. Values: left, center, right, justify',
        'width': 'Element width',
        'min-width': 'Minimum element width',
        'max-width': 'Maximum element width',
        'height': 'Element height',
        'min-width': 'Minimum element height',
        'max-width': 'Maximum element height',
        'padding': 'Change element inner space',
        'padding-top': 'Top element inner space',
        'padding-left': 'Left element inner space',
        'padding-right': 'Right element inner space',
        'padding-bottom': 'Bottom element inner space',
        'margin': 'Change element outer space',
        'margin-top': 'Top element outer space',
        'margin-left': 'Left element outer space',
        'margin-right': 'Right element outer space',
        'margin-bottom': 'Bottom element outer space',
        'border-color': 'Change element borders color',
        'border-width': 'Change element borders width',
        'border-style': 'Change element borders style. Values: dashed, dotted, double, groove, outset, ridge, solid',
        'border-top-color': 'Top element border color',
        'border-top-width': 'Top element border width',
        'border-top-style': 'Top element border style. Values: dashed, dotted, double, groove, outset, ridge, solid',
        'border-left-color': 'Left element border color',
        'border-left-width': 'Left element border width',
        'border-left-style': 'Left element border style. Values: dashed, dotted, double, groove, outset, ridge, solid',
        'border-right-color': 'Right element border color',
        'border-right-width': 'Right element border width',
        'border-right-style': 'Right element border style. Values: dashed, dotted, double, groove, outset, ridge, solid',
        'border-bottom-color': 'Bottom element border color',
        'border-bottom-width': 'Bottom element border width',
        'border-bottom-style': 'Bottom element border style. Values: dashed, dotted, double, groove, outset, ridge, solid',
        'border-radius': 'Make the borders flat (min) or round (max)',
        'box-shadow': 'Create an outset shadow of the element',
        'display': 'WARNING: This can mess the layout! Change the way the element is displayed. Values: block (classic), flex (super customizable element), none (hide the element)',
        'flex-direction': 'Require display as flex. Change the order of children elements. Values: row, row-reverse, column, column-reverse',
        'flex-wrap': 'Require display as flex. Allow elements to wrap if they go offscreen. Values: nowrap, wrap',
        'align-content': 'Require display as flex. Specifies how elements are distributed along the cross axis. Values: center, flex-start, flex-end, space-around, space-between, stretch',
        'justify-content': 'Require display as flex. Specifies the default alignment for items horizontally. Values: center, flex-start, flex-end, space-around, space-between, space-evenly',
        'align-items': 'Require display as flex. Specifies the default alignment for items vertically. Values: center, flex-start, flex-end, stretch, baseline',
        'gap': 'Set a gap between all children elements',
        'filter': 'Apply a custom filter. Values: blur(0>=px), brightness(0.0~1), contrast(0.0~1), grayscale(0.0~1), hue-rotate(xdeg), saturate(0.0~1), sepia(0.0~1). Examples: blur(10px), any ~ contrast(0.5), hue-rotate(35deg)'
    }

    function getRGBA(color, alpha) {
        color = color.value();
        alpha = alpha.value() / 10;
        if (color.includes('#')) {
            const [_, r, g, b] = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
            return `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16) },${alpha})`;
        };
        if (!color.includes('rgba')) color = color.replace('rgb', 'rgba');
        let temp = color.split(',');
        temp[temp.length - 1] = `${temp[temp.length - 1].split(')')[0]},${alpha})`;
        return temp.join(',');
    };

    function showTooltip(text, left, top) {
        if (!text) {
            tooltip.style({ display: 'none' });
            return;
        };
        tooltip.write(text);
        tooltip.style({ display: 'block', top: `${top + 20}px`, left: `${left + 20}px` });
    };

    function create(forceUpdate) {
        if (ui.style('display') === 'flex' && !forceUpdate) return;
        //Auto generate based on theme itself and other installed plugins
        const defaultCSS = window._skUI_Theme.css;
        if (ui._content.child().length === 0) for (plugin in defaultCSS) {
            const id = `skTheme_${plugin.replaceAll('-', '_').replaceAll(' ', '')}`;
            const container = sk.ui.make.container({ id: id, style: { display: 'none' }, class: 'skTheme_Editor' });
            const button = sk.ui.make.container({
                text: plugin, class: 'nav-link', style: { cursor: 'pointer' }, event: {
                    type: 'click', callback: () => {
                        sk.tool.getAll('.skTheme_Editor').forEach(e => e.style({ display: 'none' }));
                        container.style({ display: 'block' });
                    }
                }
            });
            //Category
            for (category in defaultCSS[plugin]) {
                const categoryContainer = sk.ui.make.container();
                const categoryTitle = sk.ui.make.title({ text: category, style: { cursor: 'pointer' }, event: { type: 'click', callback: (e) => e.target.nextSibling.style.display = e.target.nextSibling.style.display === 'none' ? 'block' : 'none' } });
                const categoryElement = sk.ui.make.container({ style: { display: 'none' } });
                categoryContainer.append([categoryTitle, categoryElement]);
                //Element to style
                for (element in defaultCSS[plugin][category]) {
                    const divider = sk.ui.make.divider({ style: { 'border-top-width': '1rem' } });
                    const elementContainer = sk.ui.make.container();
                    const elementTitle = sk.ui.make.subTitle({ text: element, style: { cursor: 'pointer' }, event: { type: 'click', callback: (e) => e.target.nextSibling.style.display = e.target.nextSibling.style.display === 'none' ? 'block' : 'none' } });
                    const elementProperty = sk.ui.make.container({ style: { display: 'none' } });
                    elementContainer.append([elementTitle, elementProperty]);
                    //Avaiable property
                    const selector = defaultCSS[plugin][category][element].selector;
                    let oddBackground = true;
                    let cssToUse;
                    if (element === 'All') cssToUse = { 'scrollbar-color': 'Change all scrollbars color', 'transition': 'Animate all elements' };
                    if (element === 'Star') cssToUse = { 'fill': 'Change the filling color for stars' };
                    if (!cssToUse) cssToUse = cssProperty;
                    for (property in cssToUse) {
                        const card = sk.ui.make.container({ flex: true, style: { 'justify-content': 'flex-start', padding: '0 2.5%' } });
                        if (oddBackground) card.style({ background: 'rgba(0,0,0,.25)' });
                        const name = sk.ui.make.description({ text: property, style: { margin: 'auto 0' }, event: [{ type: 'mouseenter', callback: (e) => { console.log(e); showTooltip(name.attribute('_tooltip'), e.pageX, e.pageY); } }, { type: 'mouseleave', callback: () => showTooltip() }] });
                        name.attribute({ _top: name.element.offsetTop, _left: name.element.offsetLeft, _tooltip: cssToUse[property] });
                        const inputs = sk.ui.make.container({ flex: true, style: { 'margin-left': 'auto' } });
                        let input = sk.ui.make.input({ class: 'text-input', attribute: { _plugin: plugin, _category: category, _element: element, _property: property, _selector: selector } });
                        inputs.append(input);
                        //Color picker
                        if (property.includes('color') || property === 'fill') {
                            const colorEvent = () => {
                                const newValue = getRGBA(input, alphaColor);
                                input.attribute('_selector').split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(input.attribute('_property'), newValue, 'important')));
                                updateLiveEdit(input.attribute('_plugin'), input.attribute('_category'), input.attribute('_element'), input.attribute('_property'), input.attribute('_selector'), newValue);
                            };
                            input.attribute({ type: 'color' });
                            input.event({ type: 'change', callback: colorEvent });
                            const alphaColor = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '10', value: '10', title: 'Alpha channel' }, event: { type: 'input', callback: colorEvent } });
                            inputs.append(alphaColor);
                        };
                        //Range slider
                        if (!property.includes('color') && !exceptions.includes(property)) {
                            input.attribute({ type: 'range', min: '0', max: '100', value: '0' });
                            input.event({
                                type: 'input', callback: () => {
                                    let newValue;
                                    if (cssREM.includes(input.attribute('_property')) && input.attribute('_property').includes('font-size')) newValue = `${input.value() / 10}rem`;
                                    if (cssREM.includes(input.attribute('_property')) && !input.attribute('_property').includes('font-size')) newValue = `${input.value()}rem`;
                                    if (!cssREM.includes(input.attribute('_property'))) newValue = `${input.value()}%`;
                                    input.attribute('_selector').split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(input.attribute('_property'), newValue, 'important')))
                                    updateLiveEdit(input.attribute('_plugin'), input.attribute('_category'), input.attribute('_element'), input.attribute('_property'), input.attribute('_selector'), newValue);
                                }
                            });
                        };
                        //Text input
                        if (!input.attribute('type') && exceptions.includes(property)) {
                            if (property === 'animation') {
                                const animationEvent = () => {
                                    const newValue = `all ${input.value()}s ${animationType.value()}`
                                    input.attribute('_selector').split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(input.attribute('_property'), newValue, 'important')))
                                    updateLiveEdit(input.attribute('_plugin'), input.attribute('_category'), input.attribute('_element'), input.attribute('_property'), input.attribute('_selector'), newValue);
                                };
                                input.attribute({ type: 'text', placeholder: 'Duration in seconds' });
                                input.event({ type: 'change', callback: animationEvent });
                                const animationType = sk.ui.make.input({ attribute: { type: 'text', placeholder: 'Hover me', title: 'Animation type. Values: linear, ease-in, ease-out, ease-in-out' }, event: { type: 'change', callback: animationEvent } });
                            }
                            else if (property === 'background-image') {
                                input.attribute({ type: 'text', placeholder: 'Image ID/filename' });
                                input.event({
                                    type: 'change', callback: async () => {
                                        const value = input.value();
                                        let path;
                                        if (!isNaN(value)) {
                                            const image = await sk.stash.find.image(value);
                                            path = image.paths.image;
                                        };
                                        if (isNaN(value)) path = `/plugin/skUI - Assets/assets/Custom/${value}`;
                                        input.attribute('_selector').split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(input.attribute('_property'), `url(${path})`, 'important')));
                                        updateLiveEdit(input.attribute('_plugin'), input.attribute('_category'), input.attribute('_element'), input.attribute('_property'), input.attribute('_selector'), `url(${path})`);
                                    }
                                });
                            }
                            else if (property === 'border-radius') {
                                const borderRadiusEvent = () => {
                                    const newValue = `${input.value()}% ${topRight.value()}% ${bottomLeft.value()}% ${bottomRight.value()}%`;
                                    input.attribute('_selector').split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(input.attribute('_property'), newValue, 'important')))
                                    updateLiveEdit(input.attribute('_plugin'), input.attribute('_category'), input.attribute('_element'), input.attribute('_property'), input.attribute('_selector'), `url(${path})`);
                                };
                                //top-left
                                input.attribute({ type: 'range', min: '0', max: '200', value: '100', title: 'Top-left border' });
                                input.event({ type: 'input', callback: borderRadiusEvent });
                                const topRight = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '200', value: '100', title: 'Top-right border' }, event: { type: 'input', callback: borderRadiusEvent } });
                                const bottomLeft = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '200', value: '100', title: 'Bottom-left border' }, event: { type: 'input', callback: borderRadiusEvent } });
                                const bottomRight = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '200', value: '100', title: 'Bottom-right border' }, event: { type: 'input', callback: borderRadiusEvent } });
                                inputs.append([topRight, bottomLeft, bottomRight]);
                                inputs.style({ 'flex-direction': 'column' });
                            }
                            else if (property === 'box-shadow') {
                                const boxShadowEvent = () => {
                                    const newValue = `${getRGBA(input, alphaColor)} ${xOffest}px ${yOffest}px ${blur}px ${spread}px`;
                                    input.attribute('_selector').split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(input.attribute('_property'), newValue, 'important')))
                                    updateLiveEdit(input.attribute('_plugin'), input.attribute('_category'), input.attribute('_element'), input.attribute('_property'), input.attribute('_selector'), `url(${path})`);
                                };
                                input.attribute({ type: 'color' });
                                input.event({ type: 'change', callback: boxShadowEvent });
                                const alphaColor = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '10', value: '10', title: 'Alpha channel' }, event: { type: 'input', callback: boxShadowEvent } });
                                const xOffest = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '200', value: '100', title: 'X offest' }, event: { type: 'input', callback: boxShadowEvent } });
                                const yOffest = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '200', value: '100', title: 'Y offest' }, event: { type: 'input', callback: boxShadowEvent } });
                                const blur = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '200', value: '100', title: 'Blur' }, event: { type: 'input', callback: boxShadowEvent } });
                                const spread = sk.ui.make.input({ attribute: { type: 'range', min: '0', max: '200', value: '100', title: 'Spread' }, event: { type: 'input', callback: boxShadowEvent } });
                                inputs.append([alphaColor, xOffest, yOffest, blur, spread]);
                                inputs.style({ 'flex-direction': 'column' });
                            }
                            else {
                                input.attribute({ type: 'text', placeholder: 'Hover the property' });
                                input.event({
                                    type: 'change', callback: () => {
                                        input.attribute('_selector').split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(input.attribute('_property'), input.value(), 'important')));
                                        updateLiveEdit(input.attribute('_plugin'), input.attribute('_category'), input.attribute('_element'), input.attribute('_property'), input.attribute('_selector'), input.value());
                                    }
                                });
                            };
                        };
                        card.append([name, inputs]);
                        elementProperty.append(card);
                        oddBackground = oddBackground ? false : true;
                    };
                    oddBackground = true;
                    categoryElement.append([divider, elementContainer]);
                };
                container.append(categoryContainer);
            };
            ui._navigation.append(button);
            ui._content.append(container);
        };
        ui._content.append(themeManager.initialize());
        ui._navigation.child()[0].click();
        ui.style({ display: 'flex' });
    };

    //Theme UI
    const themeManager = {
        //Util
        _fileReader: async (file, json) => {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = e => resolve(e.target.result);
                fileReader.onerror = e => reject(e);
                json ? fileReader.readAsText(file) : fileReader.readAsDataURL(file);
            });
        },
        //All user themes
        _themes: JSON.parse(localStorage.getItem('skTheme - Preset')) || {},
        //Create and return theme options buttons
        _themeOptions: (themeCard, theme) => {
            const themeButtons = sk.ui.make.container({ flex: true });
            const themeLoad = sk.ui.make.button({
                text: 'Load', class: 'btn btn-primary', event: {
                    type: 'click', callback: () => {
                        if (sk.tool.get('.skTheme_Themes_Card.btn-primary')) sk.tool.get('.skTheme_Themes_Card.btn-primary').class('btn-primary');
                        themeCard.class('btn-primary');
                        if (!themeManager._themes[theme]) themeManager._themes = JSON.parse(localStorage.getItem('skTheme - Preset'));
                        for (plugin in themeManager._themes[theme].css) {
                            parseCSS(plugin, themeManager._themes[plugin], true);
                            for (category in themeManager._themes[theme].css[plugin]) {
                                for (element in themeManager._themes[theme].css[plugin][category]) {
                                    for (property in themeManager._themes[theme].css[plugin][category][element]) {
                                        if (property !== 'selector') themeManager._themes[theme].css[plugin][category][element].selector.split(',').forEach(a => sk.tool.getAll(a).forEach(e => e.element.style.setProperty(property, themeManager._themes[theme].css[plugin][category][element][property], 'important')));
                                    }
                                }
                            }
                        };

                    }
                }
            });
            const themeShare = sk.ui.make.button({
                text: 'Share', class: 'btn btn-secondary', event: {
                    type: 'click', callback: async () => {
                        await navigator.clipboard.write([new ClipboardItem({
                            'text/plain': JSON.stringify({ theme: theme, data: themeManager._themes[theme] })
                        })]);
                    }
                }
            });
            const themeDelete = sk.ui.make.button({
                text: 'Delete', class: 'btn btn-danger', event: {
                    type: 'click', callback: () => {
                        delete themeManager._themes[theme];
                        localStorage.setItem('skTheme - Preset', JSON.stringify(themeManager._themes));
                        themeCard.remove();
                        let customCSS = sk.stash.configuration().interface.css;
                        save(customCSS.split('/* skTheme - Start! */')[0]);
                    }
                }
            });
            themeButtons.append([themeLoad, themeShare, themeDelete]);
            return themeButtons;
        },
        //Create & Populate themes section
        initialize: () => {
            const themeContainer = sk.ui.make.container({ id: 'skTheme_Themes', style: { display: 'none' }, class: 'skTheme_Editor' });
            const load = themeManager.load();
            const save = themeManager.save();
            const backup = themeManager.backup();
            themeContainer.append([themeManager.load(), themeManager.save(), themeManager.backup()]);
            return themeContainer;
        },
        //Theme loader
        load: () => {
            const loadTheme = sk.ui.make.container({ flex: true });
            if (themeManager._themes) {
                for (theme in themeManager._themes) {
                    const themeCard = sk.ui.make.container({ class: 'card skTheme_Themes_Card' });
                    if (theme === settings.theme) themeCard.class('btn-secondary');
                    const themePreview = sk.ui.make.image({ url: themeManager._themes[theme].preview });
                    const themeName = sk.ui.make.subTitle({ text: theme });
                    themeCard.append([themePreview, themeName, themeManager._themeOptions(themeCard, theme)]);
                    loadTheme.append(themeCard);
                };
            };
            return loadTheme;
        },
        //Theme saver
        _screenshot: async () => {
            try {
                ui.style({ opacity: 0 });
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        displaySurface: 'browser',
                    },
                    audio: {
                        suppressLocalAudioPlayback: true,
                    },
                    preferCurrentTab: true,
                    selfBrowserSurface: 'include',
                    systemAudio: 'exclude',
                    surfaceSwitching: 'exclude',
                    monitorTypeSurfaces: 'exclude',
                });
                const video = document.createElement('video');
                video.srcObject = stream;
                await video.play();
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                stream.getTracks().forEach(track => track.stop());
                const preview = canvas.toDataURL('image/jpeg');
                ui.style({ opacity: 1 });
                return preview;
            }
            catch (e) {
                console.log(e);
                return false;
            };
        },
        save: () => {
            const saveThemeContainer = sk.ui.make.container({ flex: true, style: { 'flex-direction': 'column', gap: '1rem' } });
            const themeDataContainer = sk.ui.make.container({ flex: true, style: { gap: '1rem' } });
            //Theme info preview
            const themePreviewContainer = sk.ui.make.container({ flex: true, style: { 'flex-direction': 'column', gap: '1rem' } });
            const themeImage = sk.ui.make.image({ style: { 'max-width': '132px', 'max-height': '132px' } });
            const themeName = sk.ui.make.input({ attribute: { type: 'text', placeholder: 'Theme name', class: 'text-input' } });
            themePreviewContainer.append([themeImage, themeName]);
            //Theme image loader
            const themeImageLoader = sk.ui.make.container({ flex: true, style: { gap: '1rem' } });
            const themeScreenshot = sk.ui.make.button({
                text: 'Screenshot', class: 'btn btn-secondary', event: {
                    type: 'click', callback: async () => {
                        const screenshot = await themeManager._screenshot() || '/plugin/skUI - Assets/assets/Core/Theme.png';
                        themeImage.url(screenshot);
                    }
                }
            });
            const themeImageUpload = sk.ui.make.button({ text: 'Upload', class: 'btn btn-secondary', event: { type: 'click', callback: () => { themeImageFile.click(); } } });
            const themeImageFile = sk.ui.make.input({
                attribute: { type: 'file' }, event: {
                    type: 'change', callback: async (event) => {
                        const file = event.target.files[0];
                        if (file.type !== 'image/png' && file.type !== 'image/gif' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
                            window.alert('Must be a .png, .gif or .jpg/.jpeg');
                            return;
                        };
                        const uploadedImage = await themeManager._fileReader(file);
                        themeImage.url(uploadedImage);
                    }
                }
            });
            themeImageLoader.append([themeScreenshot, themeImageUpload]);
            themeDataContainer.append([themePreviewContainer, themeImageLoader]);
            //Saver
            const themeSaveContainer = sk.ui.make.container({ flex: true, style: { gap: '1rem' } });
            const themeSave = sk.ui.make.button({
                text: 'Save theme', class: 'btn btn-success', event: {
                    type: 'click', callback: async () => {
                        const themePreview = themeImage.url();
                        if (!themePreview) return;
                        themeManager._themes[themeName.value()] = {
                            preview: themePreview,
                            css: liveEdit
                        };
                        localStorage.setItem('skTheme - Preset', JSON.stringify(themeManager._themes));
                        if (sk.tool.get('.skTheme_Themes_Card.btn-primary')) sk.tool.get('.skTheme_Themes_Card.btn-primary').class('btn-primary');
                        const newCard = sk.ui.make.container({ class: 'card btn-primary' });
                        const newPreview = sk.ui.make.image({ url: themePreview });
                        const newName = sk.ui.make.subTitle({ text: themeName.value() });
                        newCard.append([newPreview, newName, themeManager._themeOptions(newCard, themeName.value())]);
                        loadTheme.append(newCard);
                        for (plugin in liveEdit) parseCSS(plugin, liveEdit[plugin], true);
                    }
                }
            });
            //Shared
            const themeShared = sk.ui.make.button({
                text: 'Import Shared', class: 'btn btn-secondary', event: {
                    type: 'click', callback: async () => {
                        const sharedData = await navigator.clipboard.read();
                        const parsedSharedData = await sharedData[0].getType('text/plain');
                        let jsonTheme = await parsedSharedData.text();
                        jsonTheme = JSON.parse(jsonTheme);
                        if (!jsonTheme.theme || !jsonTheme.data) return;
                        let lastI = 1;
                        if (themeManager._themes[jsonTheme.theme]) {
                            for (checkTheme in themeManager._themes) {
                                if (checkTheme.includes(jsonTheme.theme) && checkTheme.includes('Shared_')) {
                                    const findI = Number(checkTheme.split('Shared_')[1].split(' ')[0]);
                                    if (findI > lastI) lastI = findI;
                                }
                            }
                        }
                        themeManager._themes[`Shared_${lastI} ${jsonTheme.theme}`] = jsonTheme.data;
                        localStorage.setItem('skTheme - Preset', JSON.stringify(themeManager._themes));
                        const newCard = sk.ui.make.container({ class: 'card' });
                        const newPreview = sk.ui.make.image({ url: jsonTheme.data.preview });
                        const newName = sk.ui.make.subTitle({ text: jsonTheme.theme });
                        newCard.append([newPreview, newName, themeManager._themeOptions(newCard, `Shared_${lastI} ${jsonTheme.theme}`)]);
                        loadTheme.append(newCard);
                    }
                }
            })
            saveThemeContainer.append([themeDataContainer, themeShared]);
            return saveThemeContainer;
        },
        backup: () => {
            const importExport = sk.ui.make.container({ flex: true, style: { 'justify-content': 'space-around', 'margin-top': '10%' } });
            const importPreset = sk.ui.make.input({
                style: { display: 'none' }, attribute: { type: 'file' }, event: {
                    type: 'change', callback: async (event) => {
                        const importedCSS = JSON.parse(await themeManager._fileReader(event.target.files[0], true));
                        if (!importedCSS) return;
                        localStorage.setItem('skTheme - Preset', JSON.stringify(importedCSS));
                        ui.write('', true)
                        create(true);
                    }
                }
            });
            const importButton = sk.ui.make.button({ text: 'Import Themes', class: 'btn btn-secondary', event: { type: 'click', callback: () => importPreset.click() } });
            const exportPreset = sk.ui.make.button({
                text: 'Export Themes', class: 'btn btn-danger', event: {
                    type: 'click', callback: () => {
                        const toExport = new File([JSON.stringify(themeManager._themes)], 'themeManager._themes.txt', { type: 'text/plain' });
                        const downloadExport = sk.ui.make.link({ url: URL.createObjectURL(toExport), attribute: { download: 'themeManager._themes.txt' } });
                        downloadExport.click();
                    }
                }
            });
            importExport.append([importButton, importPreset, exportPreset]);
            return importExport;
        }
    };

    //CSS Parser & Saver

    async function parseCSS(plugin, defaultCSS, replace) {
        window._skUI_Theme.css[plugin] = defaultCSS;
        let customCSS = sk.stash.configuration().interface.css;
        if (customCSS.includes(`skTheme - Part: ${plugin}`) && !replace) return;
        if (customCSS.includes(`skTheme - Part: ${plugin}`) && replace) {
            const cssToReplace = customCSS.split(`skTheme - Part: ${plugin}`)[1].split('/* skTheme - Part')[0];
            customCSS = customCSS.replace(`skTheme - Part: ${plugin}${cssToReplace}`, '');
        };
        let css = `
            /* skTheme - Start! */
            /* skTheme - Part: ${plugin} */
        `;
        if (customCSS.includes('skTheme - Start!')) css = `/* skTheme - Part: ${plugin} */`;
        for (category in defaultCSS) {
            for (element in defaultCSS[category]) {
                let style = '';
                for (property in defaultCSS[category][element]) if (property !== 'selector') style += `${property}: ${defaultCSS[category][element][property]};`;
                if (style !== '') css += `${defaultCSS[category][element].selector} {${style}}`;
            };
        };
        await save(customCSS + css);
    };

    async function save(css) {
        const variables = { input: { css: css } };
        const query = 'mutation ConfigureInterface($input: ConfigInterfaceInput!){configureInterface(input:$input){css}}';
        const configuration = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ApiKey: sk.stash.configuration().general.ApiKey || '',
            },
            body: JSON.stringify({ query: query, variables: variables })
        };
        await fetch(`/graphql`, configuration);
    };

    async function initialize() {
        const defaultSettings = {
            name: pluginName,
            options: {
                theme: ''
            }
        };
        await sk.plugin.check(defaultSettings);
        settings = await sk.plugin.get(pluginName);
        if (loaded) return;
        tooltip = sk.ui.make.container({ style: { position: 'fixed', background:'#212121', color: 'white', 'z-index': 100000, border: '3px solid #303030', display: 'none'} });
        document.body.append(tooltip.element);
        const linkUI = sk.ui.make.image({ url: '/plugin/skUI - Assets/assets/Core/skUI - Theme.png', style: { width: '70px', cursor: 'pointer' }, event: { type: 'click', callback: create } });
        const navbar = sk.ui.get.navbar().buttons;
        navbar.style({ display: 'flex' });
        navbar.append(linkUI);
        ui = sk.ui.make.popUp({ flex: true, class: 'bg-dark', style: { 'flex-direction': 'column', 'align-items': 'flex-start', 'justify-content': 'flex-start', width: '27.5%', height: '100%', padding: '1%', top: 0, right: 0, display: 'none', 'box-shadow': '0 0 5px black', 'overflow-y': 'auto' } });
        ui._navigation = sk.ui.make.container({ flex: true, style: { 'flex-wrap': 'wrap' } });
        ui._content = sk.ui.make.container({ style: { width: '100%', 'text-align': 'left'} });
        ui._actions = sk.ui.make.container({ flex: true, style: { 'margin-top': 'auto', width: '100%', 'justify-content': 'space-evenly' } });
        const hide = sk.ui.make.button({ class: 'btn btn-secondary', text: 'Hide', event: [{ type: 'mouseenter', callback: () => { ui.style({ opacity: 0 }); } }, { type: 'mouseleave', callback: () => { ui.style({ opacity: 1 }); } }]})
        const close = sk.ui.make.button({ class: 'btn btn-danger', text: 'Close', event: { type: 'click', callback: () => { ui.style({ display: 'none' }); } } });
        const themes = sk.ui.make.button({
            class: 'btn btn-primary', text: 'Themes', event: {
                type: 'click', callback: () => {
                    sk.tool.getAll('.skTheme_Editor').forEach(e => e.style({ display: 'none' }));
                    sk.tool.get('#skTheme_Themes').style({ display: 'block' });
                }
            }
        });
        ui._actions.append([hide, close, themes]);
        ui.append([ui._navigation, ui._content, ui._actions]);
        document.body.append(ui.element);
        loaded = true;
    };

    sk.tool.wait('nav', initialize, true);

    window._skUI_Theme = {
        css: {},
        load: parseCSS
    };

    window._skUI_Theme.load('Stash', {
        Global: {
            All: { selector: '*' },
            Body: { selector: 'body' },
            'Dark background': { selector: '.bg-dark' },
            'Main container': { selector: '.main .container-fluid' },
            'Filter bar': { selector: '.filtered-list-toolar' },
            Buttons: { selector: '.btn' },
            'Primary button': { selector: '.btn-primary' },
            'Secondary button': { selector: '.btn-secondary' },
            'Success button': {selector: '.btn-success'},
            'Danger button': { selector: '.btn-danger' },
            'Active button': { selector: '.btn.active' },
            'Disabled button': { selector: '.btn-secondary.disaled,.btn-secondary:disaled' },
            'Text field': { selector: '.text-input,.clearale-text-field' },
            'Slider bar': { selector: 'input[type=range],input[type=range].zoom-slider' },
            'Slider dot': { selector: 'input[type=range]::-webkit-slider-thumb,input[type=range]::-mox-range-thumb,input[type=range].zoom-slider::-webkit-slider-thumb,input[type=range].zoom-slider::-mox-range-thumb' },
            'Switch checked': { selector: '.custom-control-input:checked ~ .custom-control-label:before' },
            'Switch unchecked': { selector: '.custom-switch .custom-control-label:before' },
            'Dropdown': {selector: '.react-select__control'},
            Badge: { selector: '.badge' },
            Star: {selector: '.fa-star path'}
        },
        Navigation: {
            Nav: { selector: 'nav', },
            'Nav brand': { selector: '.navbar-brand' },
            'Nav menu': { selector: '.navbar-nav' },
            'Nav buttons': { selector: '.navbar-buttons' },
            'Nav active': { selector: '.nav-link .active' }
        },
        Home: {
            Recommendations: { selector: '.recommendation-row' },
            'Recommendations title': { selector: '.reccomendation-row-head' },
            'Recommendations content': { selector: '.slick-slider' },
            Footer: { selector: '.recommendation-footer' }
        },
        'Detail Page': {
            'Info panel': { selector: '.scene-tabs,.image-tabs,gallery-tabs' },
            'Studio logo': { selector: 'h1.studio-logo' },
            Title: { selector: 'h3.scene-header,h3.image-header,h3.gallery-header' },
            'Queue controls': { selector: '.queue-controls' },
            'Queue content': { selector: '#queue-content' },
            'Queue element': { selector: '#queue-content li' },
            'Marker card': { selector: '.scene-markers-panel .primary-card' },
            'Marker video': { selector: '.scene-markers-panel .wall-item-media' },
            'Marker info': { selector: '.scene-markers-panel .wall-item-text' },
            'Video player': {selector: '.video-js,.vjs-tech'},
            'Video controls': { selector: '.vjs-control-bar' },
            'Image': { selector: '.image-container .image-image' },
            'Background image': { selector: '.detail-header,.background-image-container,.background-image' },
            'Detail title': { selector: '.detail-item-title' },
            'Detail value': {selector: '.detail-item-value'}
        },
        'All cards': {
            Cards: { selector: '.card' },
            Favorite: { selector: '.card .favorite,.card .not-favorite' },
            'Rating banner': { selector: '.card .rating-banner' },
            'Studio overlay': { selector: '.card .studio-overlay' },
            'Top section': { selector: '.card .preview-section,.card .video-section' },
            'Image preview': { selector: '.card .preview-section img,.card .thumbnail-section img' },
            'Middle section': { selector: '.card .card-section' },
            Details: { selector: '.scene-card__details,.image-card__details,.group-card__details,.scene-marker-card__details,.gallery-card__details,.studio-card__details,.tag-card__details' },
            Description: { selector: '.scene-card__description,.image-card__description,.group-card__description,.gallery-card__description,.tag-card .tag-description' },
            Date: { selector: '.scene-card__date,.image-card__date,.gallery-card__details' },
            'Title/Name': { selector: '.card h5' },
            'Bottom section': { selector: '.card .popovers' },
            'Popover text': { selector: '.card .popovers span' },
            'Popover icon': { selector: '.card .popovers svg' }
        },
        Cards: {
            Scene: { selector: '.scene-card' },
            'Scene preview': { selector: '.scene-card-preview-video ' },
            'Scene filesize': { selector: '.card .overlay-filesize' },
            'Scene resolution': { selector: '.card .overlay-resolution' },
            'Scene duration': { selector: '.card .overlay-duration' },
            'Scene speed': { selector: '.card .scene-interactive-speed-overlay' },
            'Scene path': { selector: '.card .file-path' },
            Image: { selector: '.image-card' },
            Group: { selector: '.group-card' },
            Marker: { selector: '.scene-marker-card' },
            'Marker time': { selector: '.scene-marker-card__time' },
            'Marker scene': { selector: '.scene-marker-card__scene' },
            Gallery: { selector: '.gallery-card' },
            Performer: { selector: '.performer-card' },
            'Performer disambiguation': { selector: '.performer-card .performer-disambiguation' },
            'Performer flag': { selector: '.performer-card .performer-card__country-flag' },
            'Performer gender': { selector: '.performer-card .gender-icon' },
            'Performer age': { selector: '.performer-card .performer-card__age' },
            Studio: { selector: '.studio-card' },
            'Studio child': { selector: '.studio-card .studio-child-studios' },
            Tag: { selector: '.tag-card' },
            'Tag child': { selector: '.tag-card .tag-sub-tags' },
            'Tag parent': { selector: '.tag-card .tag-parent-tags' }
        },
        Popovers: {
            Arrow: { selector: '.arrow' },
            'Image thumbnail': { selector: '.image-thumbnail' },
            Group: { selector: '.group-tag-container' },
            Performer: { selector: '.performer-tag-container' },
            Tag: { selector: '.tag-item' }
        }
    });
})();