const sk = {};
// BOOKMARK skTool

/**
 * Create and return the Tool module
 * @returns {object} Tool module
 */
sk.tool = function skTool() {
    // Store here each watcher to prevent duplication
    const _watching = {};

    /**
     * Wait for a UI element then execute a function
     * @param {string} selector Query selector for the waiting element or a sk.ui.is property
     * @param {function} callback What execute when the element is displayed
     * @param {boolean} [stopWatching] If true remove the observer
    */
    const wait = (selector, callback, stopWatching) => {
        if (get(selector)) callback();
        function setObserver() {
            const observer = new MutationObserver((mutation, obs) => {
                const wait = get(selector);
                if (wait) {
                    if (stopWatching) {
                        const currentLocation = window.location.pathname;
                        let locationChanged = false;
                        if (_watching[selector] !== currentLocation) {
                            _watching[selector] = currentLocation;
                            locationChanged = true;
                        };
                        if (!locationChanged) return;
                    };
                    callback();
                };
            });
            observer.observe(document, { childList: true, subtree: true });
        };
        setObserver();
        if (!_watching[selector]) _watching[selector];
    };

    /**
     * Create a notification, if the permission is denied console.log
     * @param {string} title
     * @param {string} message
     */
    const notify = (title, message) => {
        let _notification;
        if (Notification.permission === 'granted') _notification = new Notification(title, { body: message });
        if (Notification.permission === 'denied') console.log(`${title} - ${message}`);
        if (Notification.permission === 'default') {
            Notification.requestPermission();
            notify(title, message);
        };
    };

    /**
     * Return an array of skUI objects {@link skUI} selected inside the document or the given HTML Element/skUI object
     * @param {string} selector Query selector
     * @param {skUI|HTMLElement} [searchIn=document] Where execute the query
     * @returns {skUI[]} Selected elements
     */
    const getAll = (selector, searchIn = document) => {
        let elements = [];
        if (searchIn.element) {
            getAll(selector, searchIn.element);
            return;
        };
        const list = searchIn.querySelectorAll(selector);
        for (el of list) { elements.push(skGraphicBase(el)) };
        return elements;
    };

    /**
     * Return a skUI object {@see skUI} selected inside the document or the given HTML Element/skUI object
     * @param {string} selector Query selector
     * @param {skUI|HTMLElement} [searchIn=document] Where execute the query
     * @returns {skUI} Selected element
     */
    const get = (selector, searchIn = document) => {
        if (searchIn.element) {
            get(selector, searchIn.element);
            return;
        };
        return skGraphicBase(searchIn.querySelector(selector));
    };

    /**
     * Scrape a website. If no options given parse as text
     * @param {string} url Website url
     * @param {object} [options] Parser options
     * @param {boolean} [options.json] Parse as json
     * @param {boolean} [options.blob] Parse as blob
     * @param {boolean} [options.html] Parse as html (skUI object)
     * @returns {string|json|blob|skUI} Parse data
     */
    const scrape = async (url, options) => {
        const response = await fetch(url);
        if (!options) return await response.text();
        if (options.json) return await response.json();
        if (options.blob) return await response.blob();
        if (options.html) {
            const data = await response.text();
            const parser = new DOMParser();
            return skGraphicBase(parser.parseFromString(data, 'text/html'));
        };
    };
    return { wait, notify, get, getAll, scrape };
}();

// BOOKMARK Hook

/**
 * Create and return the Hook module
 * @returns {object} skHook module
 */
sk.hook = function skHook() {
    // Original fetch
    const _fetch = window.fetch.bind(window);

    // Custom fetch
    window.fetch = async (...args) => {
        let query;
        const url = args[0];
        if (args[1]) {
            args[1].signal = undefined;
            query = args[1].body ? JSON.parse(args[1].body).query : '';
        };
        let watcher = false;
        if (url.includes('graphql')) watcher = _find(query);
        const response = await _fetch.apply(window, args);
        const backup = response.clone();
        if (watcher) for (watch of watcher.functions) {
            const clone = backup.clone();
            const cloneResponse = await clone.json();
            let data = cloneResponse.data;
            if (!data[watcher.query]) data = data[`${watcher.query}s`] ? data[`${watcher.query}s`] : data['findGalleries'];
            if (data[watcher.query]) data = data[watcher.query];
            watch(data)
        };
        return response.bodyUsed ? backup : response;
    };

    // Avaiable hook category
    const _category = ['scene', 'sceneMarker', 'image', 'gallery', 'group', 'performer', 'studio', 'tag'];
    // Avaiable hook operation (merge only for tag)
    const _operation = ['find', 'create', 'update', 'destroy', 'merge'];
    // Store here all created hook
    let _watch = {};

    // Populate watcher placeholders
    _category.forEach((cat) => {
        _watch[cat] = {};
        _operation.forEach((ope) => {
            const uppercase = ope[0].toUpperCase() + ope.slice(1);
            const catUppercase = cat[0].toUpperCase() + cat.slice(1);
            const query = ope === 'find' ? ope + catUppercase : cat + uppercase;
            _watch[cat][ope] = { query: query, functions: [] };
        });
    });

    /**
     * @typedef {object} skHookWatcher Custom hook object
     * @prop {string} category scene, sceneMarker, image, gallery, group, performer, studio, tag
     * @prop {string} operation find, create, update, destroy, merge
     * @prop {function} callback Function to execute on hook trigger
     */

    /**
     * Return watcher for given query
     * @param {string} query GQL query
     * @returns {skHookWatcher|boolean} False or watcher object
     */
    const _find = (query) => {
        let find = false;
        _category.forEach((cat) => {
            _operation.forEach((ope) => {
                watcher = _watch[cat][ope];
                if (query.includes(watcher.query)) find = watcher;
            });
        });
        return find;
    };

    /**
     * Add a new hook
     * @param {skHookWatcher[]} watcher Watcher object/s
     */
    const add = (watcher) => {
        if (!watcher[0]) watcher = [watcher];
        watcher.forEach((watch) => {
            const category = watch.category.toLowerCase();
            const operation = watch.operation.toLowerCase();
            if (_category.includes(category) && _operation.includes(operation)) _watch[category][operation].functions.push(watch.callback);
        });
    };

    return { add };
}();

// BOOKMARK Task

/**
 * Create and return the Task module
 * @returns {object} skTool module
 */
sk.task = function skTask() {
    // Created task list
    let _tasksList = {};

    /**
     * @typedef {object} skTaskWatcher Task object
     * @prop {string} id Task id - Your plugin name
     * @prop {string} name Task name
     * @prop {string} description Task description
     * @prop {function} callback Function to execute on task run
     * @prop {*} arg Arguments to pass to the callback function
     */

    /**
     * Add new tasks
     * @param {skTaskWatcher[]} tasks Task object or tasks list
     */
    const add = (tasks) => {
        if (!tasks[0]) tasks = [tasks];
        tasks.forEach((task) => {
            if (!_tasksList[task.id]) _tasksList[task.id] = [];
            _tasksList[task.id].push(task);
        });
    };

    /**
     * Set custom tasks inside the tasks UI
     * @returns If is already setted
     */
    const _set = () => {
        if (sk.tool.get('.skTask')) return;
        let pluginCard;
        const pluginSection = sk.tool.getAll('.form-group');
        if (pluginSection.length === 3) pluginCard = pluginSection[2];
        if (!pluginCard) {
            const panelTasks = sk.tool.get('.tasks-panel-tasks');
            const hr = sk.ui.make.divider();
            const formGroup = sk.ui.make.container({ class: 'form-group' });
            const settingSection = sk.ui.make.container({ class: 'setting-section' });
            const title = sk.ui.make.title({ text: 'Plugin Tasks' });
            const card = sk.ui.make.container({ class: 'card' });
            panelTasks.append([hr, formGroup]);
            formGroup.append(settingSection);
            settingSection.append([title, card]);
            pluginCard = card;
        };
        for (taskId in _tasksList) {
            const group = sk.ui.make.container({ class: 'skTask setting-group collapsible' });
            const header = sk.ui.make.container({ class: 'setting' });
            const titleContainer = sk.ui.make.container();
            const title = sk.ui.make.subTitle({ text: taskId });
            const buttonContainer = sk.ui.make.container();
            const button = sk.ui.make.button({ class: 'setting-group-collapse-button btn btn-minimal', event: { type: 'click', callback: function () { this.parentElement.parentElement.parentElement.lastChild.classList.toggle('show'); } } });
            header.append([titleContainer, buttonContainer]);
            titleContainer.append(title);
            buttonContainer.append(button);
            const section = sk.ui.make.container({ class: 'collapsible-section collapse show' });
            pluginCard.append(group);
            group.append([header, section]);
            _tasksList[taskId].forEach((task) => {
                const settingTask = sk.ui.make.container({ class: 'setting' });
                const settingInfo = sk.ui.make.container();
                const settingTitle = sk.ui.make.subTitle({ text: task.name });
                const settingDescription = sk.ui.make.container({ class: 'sub-heading', text: task.description });
                const runContainer = sk.ui.make.container();
                const runButton = sk.ui.make.button({ class: 'btn btn-secondary btn-sm', text: task.name, event: { type: 'click', callback: () => { task.callback(task.arg) } } });
                settingTask.append([settingInfo, runContainer]);
                settingInfo.append([settingTitle, settingDescription]);
                runContainer.append(runButton);
                section.append(settingTask);
            });
        };
    };
    // Wait for the tasks configuration page
    sk.tool.wait('#configuration-tabs-tabpane-tasks', _set, true);
    return { add };
}();

// BOOKMARK skGraphicBase

/**
 * @typedef {object} skUI Custom UI element
 * @prop {HTMLElement}element The original HTML element
 * @prop {function} get Return the selected element inside skUI.element {@link sk.get}
 * @prop {function} getAll Return the selected elements inside skUI.element {@link sk.getAll}
 * @prop {function} id Return or change id
 * @prop {function} class Return the classname, enable or disable class or replace it
 * @prop {function} read Return HTML or Text
 * @prop {function} write Write HTML or Text
 * @prop {function} url Set or return src/href of the element
 * @prop {function} child Return element children
 * @prop {function} append Append children (skUI or HTML element)
 * @prop {function} event Add events to the element
 * @prop {function} style Return or change the element styles
 * @prop {function} attribute Return or change the element attributes
 * @prop {function} flex Set a preset to make the element a flex
 * @prop {function} size Set width and height of the element
 * @prop {function} remove Remove the element
 * @prop {function} click Click the element
 */

/**
 * @typedef {object} skUIOptions skUI options
 * @prop {string} [id] Element id
 * @prop {string|array} [class] String or array of classes. Ex for string 'a b c'
 * @prop {string} [text] Element inner text
 * @prop {string} [html] Element inner HTML
 * @prop {string} [url] Element src/href
 * @prop {HTMLElement|HTMLCollection[]|skUI|skUI[]} [append] Children to append
 * @prop {object|object[]} [event] Events to add {type, callback}
 * @prop {object} [style] Style to apply {css:value}
 * @prop {object} [attribute] Attribute to apply {name:value}
 * @prop {boolean} [flex] Set a preset to make the element a flex
 */

/**
 * Create and return a skUI object
 * @param {string} tag HTML element tag to create
 * @param {skUIOptions} [options] skUI options
 * @returns {skUI} The created skUI object
 */
function skGraphicBase(tag, options = {}) {
    // Where the skUI is stored
    const base = {};

    /** @const {HTMLElement} base.element The HTML element created */
    base.element = typeof tag === 'string' ? document.createElement(tag) : tag;

    /**
     * Remove the element
     */
    base.remove = () => { base.element.remove(); };

    /**
     * Return the selected elements inside skUI.element {@link sk.tool.getAll}
     * @param {string} selector Query selector
     * @returns {skUI[]} Selected elements
     */
    base.getAll = (selector) => { return sk.tool.getAll(selector, base.element); };

    /**
     * Return the selected element inside skUI.element {@link sk.tool.get}
     * @param {string} selector Query selector
     * @returns {skUI} Selected element
     */
    base.get = (selector) => { return sk.tool.get(selector, base.element); };

    /**
     * Return or change id
     * @param {string} [id] Element id
     * @returns {string} Element id
     */
    base.id = (id) => {
        if (id === undefined) return base.element.id;
        base.element.id = id;
    };

    /**
     * Return the classname, enable/disable class or replace it
     * @param {string|array} [classList] String or array of classes. Ex for string 'a b c'
     * @param {boolean} [replace] If should replace all classList with the new one
     * @returns {string} Classname
     */
    base.class = (classList, replace) => {
        if (!classList && !replace) return base.element.className || '';
        if (typeof classList === 'string') classList = classList.split(' ');
        if (replace) base.element.className = classList.join(' ');
        if (!replace) for (className of classList) { base.element.classList.toggle(className); };
    };

    /**
     * Return HTML or text
     * @param {boolean} [html] If true return HTML else text
     * @returns {string} inner Text or inner HTML
     */
    base.read = (html) => {
        if (html) return base.element.innerHTML;
        return base.element.innerText;
    };

    /**
     * Write HTML or text
     * @param {string} text Text to write
     * @param {boolean} [html] If true write inner HTML else inner text
     */
    base.write = (text, html) => html ? base.element.innerHTML = text : base.element.innerText = text;

    /**
     * Change the value
     * @param {any} value
     */
    base.value = (value) => base.element.value = value;

    /**
     * Set or return src or href of the element
     * @param {string} [url] If given apply it else return the src or href
     * @returns {string} Src or href of the element
     */
    base.url = (url) => {
        const tag = base.element.tagName.toLowerCase();
        if (tag === 'link' || tag === 'a') {
            if (!url) return base.attribute('href');
            base.element.href = url;
        };
        if (tag === 'img' || tag === 'video') {
            if (!url) return base.attribute('src');
            base.element.src = url;
        };
    };

    /**
     * Return the element children
     * @returns {HTMLCollection} Children
     */
    base.child = () => { return base.element.children };

    /**
     * Append children (skUI or HTML element)
     * @param {HTMLElement|HTMLCollection[]|skUI|skUI[]} [options.append] Children to append
     */
    base.append = (children) => {
        if (!children[0]) children = [children];
        children.forEach((child) => { child.element ? base.element.appendChild(child.element) : base.element.appendChild(child); });
    };

    /**
     * Add events to the element
     * @param {object|object[]} eventList Events to add
     * @param {string} eventList[].type Event type
     * @param {function} eventList[].callback Function to execute
     */
    base.event = (eventsList) => {
        if (!eventsList[0]) eventsList = [eventsList];
        eventsList.forEach((ev) => { base.element.addEventListener(ev.type, ev.callback); });
    };

    /**
     * Return or change the element styles
     * @param {string|object} styles Styles to apply or the style to get {css:value}
     * @param {boolean} [important] If true apply the styles as important
     * @returns {string} Style value
     */
    base.style = (styles, important = false) => {
        if (typeof styles === 'string') return base.element.style.getPropertyValue(styles);
        important = important ? 'important' : '';
        for (style in styles) { base.element.style.setProperty(style, styles[style], important) };
    };

    /**
     * Return or change the element attributes
     * @param {string|object} attributes Attributes to apply or the attribute to get {name:value}
     * @returns {string} Attribute value
     */
    base.attribute = (attributes) => {
        if (typeof attributes === 'string') return base.element.getAttribute(attributes);
        for (attribute in attributes) { base.element.setAttribute(attribute, attributes[attribute]) };
    };

    /**
     * Set a preset to make the element a flex
     */
    base.flex = () => { base.style({ 'display': 'flex', 'justify-content': 'center', 'align-items': 'center' }); };

    /**
     * Set width and height of the element
     * @param {string} [width] Width to set
     * @param {string} [height] Height to set
     */
    base.size = (width, height) => {
        const size = {};
        if (width) size.width = width;
        if (height) size.height = height;
        base.style({ size });
    };

    /**
     * Remove the element
     */
    base.remove = () => { base.element.remove() };

    /**
     * Click the element
     */
    base.click = () => { base.element.click(); };

    for (init in options) {
        if (init !== 'text' && init !== 'html') base[init](options[init]);
        if (init === 'text') base.write(options[init]);
        if (init === 'html') base.write(options[init], true);
    };
    return base.element ? base : false;
};

// BOOKMARK skGraphic

/**
 * Create and return the UI module
 * @returns {object} skGraphic module
 */
sk.ui = function skGraphic() {
    // UI Checker
    const is = {
        home: '.recommendations-container',
        sceneCard: '.scene-card',
        scenePage: '.scene-tabs',
        imageCard: '.image-card',
        imagePage: '.image-tabs',
        groupCard: '.group-card',
        groupPage: '#group-page',
        markerCard: '.scene-marker-card',
        galleryCard: '.gallery-card',
        galleryPage: '.gallery-tabs',
        performerCard: '.performer-card',
        performerPage: '#performer-page',
        studioCard: '.studio-card',
        studioPage: '#studio-page',
        tagCard: '.tag-card',
        tagPage: '#tag-page'
    };

    /**
     * @typedef {object} skBaseCard
     * @prop {skUI} favorite Heart icon
     * @prop {skUI} ratingBanner Rating banner
     * @prop {string} raitng Element rating
     * @prop {skUI} popovers Popovers section (bottom)
     * @prop {skUI} scenes Scenes popover
     * @prop {skUI} scenesIcon Scenes popover icon
     * @prop {skUI} scenesCount Scenes popover count
     * @prop {skUI} tags Tags popover
     * @prop {skUI} tagsIcon Tags popover icon
     * @prop {skUI} tasgsCount Tags popover count
     * @prop {skUI} performers Performers popover
     * @prop {skUI} performersIcon Performers popover icon
     * @prop {skUI} performersCount Performers popover count
     * @prop {skUI} groups Groups popover
     * @prop {skUI} groupsIcon Groups popover icon
     * @prop {skUI} groupsCount Groups popover count
     * @prop {skUI} images Images popover
     * @prop {skUI} imagesIcon Images popover icon
     * @prop {skUI} imagesCount Images popover count
     * @prop {skUI} markers Markers popover
     * @prop {skUI} markersIcon Markers popover icon
     * @prop {skUI} markersCount Markers popover count
     * @prop {skUI} galleries Galleries popover
     * @prop {skUI} galleriesIcon Galleries popover icon
     * @prop {skUI} galleriesCount Galleries popover count
     * @prop {skUI} copies Copies popover
     * @prop {skUI} copiesIcon Copies popover icon
     * @prop {skUI} copiesCount Copies popover count
     * @prop {skUI} organized Organized icon
     */

    /**
     * Get and return general card info
     * @param {skUI} card Card element
     * @returns {skBaseCard} Card info
     */
    const _cardInfo = (card) => {
        const data = {};
        const isFavorite = card.get('.favorite');
        const notFavorite = card.get('.not-favorite');
        data.favorite = isFavorite ? isFavorite : notFavorite;
        data.ratingBanner = card.get('.rating-banner');
        if (data.ratingBanner) data.rating = data.ratingBanner.read().split(' ')[1];
        data.popovers = card.get('.card-popovers');
        data.scenes = card.get('.scene-count');
        if (data.scenes) {
            data.scenes.icon = data.scenes.get('svg');
            data.scenes.count = data.scenes.get('span');
        };
        data.tags = card.get('.tag-count');
        if (data.tags) {
            data.tagsIcon = data.tags.get('svg');
            data.tagsCount = data.tags.get('span');
        };
        data.performers = card.get('.performer-count');
        if (data.performers) {
            data.performerIcon = data.performers.get('svg');
            data.performerCount = data.performers.get('span');
        };
        data.groups = card.get('.group-count');
        if (data.groups) {
            data.groupsIcon = data.groups.get('svg');
            data.groupsCount = data.groups.get('span');
        };
        data.images = card.get('.image-count');
        if (data.images) {
            data.imagesIcon = data.images.get('svg');
            data.imagesCount = data.images.get('span');
        };
        data.markers = card.get('.marker-count');
        if (data.markers) {
            data.markersIcon = data.markers.get('svg');
            data.markersCount = data.markers.get('span');
        };
        data.galleries = card.get('.gallery-count');
        if (data.galleries) {
            data.galleriesIcon = data.galleries.get('svg');
            data.galleriesCount = data.galleries.get('span');
        };
        data.copies = card.get('.other-copies');
        if (data.copies) {
            data.copiesIcon = data.copies.get('svg');
            data.copiesCount = data.copies.get('span');
        };
        data.organized = card.get('.organized');
        return data;
    };

    // UI Selector
    const get = {
        // GENERAL

        /**
         * @typedef {object} _skUINavbar
         * @prop {skUI} brand Brand container (left)
         * @prop {skUI} nav Category container (center)
         * @prop {skUI} buttons Buttons container (right)
         * @prop {function} add Create, append and return a new navbar button
        */

        /**
         * @typedef {skUI & _skUINavbar} skUINavbar
         */

        /**
         * Return the navbar UI element
         * @returns {skUINavbar} Navbar
         */
        navbar: () => {
            const navbar = sk.tool.get('nav');
            navbar.brand = sk.tool.get('.navbar-brand');
            navbar.nav = sk.tool.get('.navbar-nav');
            navbar.buttons = sk.tool.get('.navbar-buttons');

            /**
            * Create, append and return a new navbar button
            * @param {string} name Button name
            * @param {function} [callback] Function to execute when clicked
            * @param {string} [where=nav] Where append the button. brand/nav/buttons
            * @returns {skUI} Button element
            */
            navbar.add = (name, callback, where) => {
                const div = make.container({ class: 'col-4 col-sm-3 col-md-2 col-1 g-auto nav-link' });
                const a = make.link({ class: 'minimal p-4 p-xl-2 d-flex d-xl-inline-block flex-column justify-content-between align-items-center btn btn-primary' });
                a.event({
                    type: 'click', callback: () => {
                        navbar.nav.get('.active').class('active');
                        if (callback) callback();
                    }
                });
                const text = make.span({ text: name });
                navbar[where].append(div)
                div.append(a);
                a.append(text)
                return div;
            };
            return navbar;
        },
        /**
         * @typedef {object} _skUIContainer
         * @prop {function} custom Create a custom container
         * @prop {function} active Return the current active Stash container
         */

        /**
         * @typedef {skUI & _skUIContainer} skUIContainer
         */

        /**
         * Return the main content container UI
         * @returns {skUIContainer} Main container
         */
        container: () => {
            const container = sk.tool.get('.main.container-fluid');

            /**
             * Create a custom content container
             * @param {skUIOptions} options Options
             * @returns {skUI} Custom content container
             */
            container.custom = (options) => {
                if (options.class === 'string') options.class = `${options.class} skContainer`;
                if (Array.isArray(options.class)) options.class.push('skContainer');
                if (!options.class) options.class = 'skContainer';
                const custom = sk.ui.make.container(options);
                container.append(custom);
                get.navbar().nav.getAll('a').forEach((a) => { a.event({ type: 'click', callback: () => { const all = sk.tool.getAll('.skContainer'); all.forEach((c) => { c.style({ display: 'none' }); }); } }) });
                return custom;
            };
            /**
             * Return the current active Stash content container
             * @returns {skUI} Content container
             */
            container.active = () => { return sk.tool.get('.item-list-container') || sk.tool.get('.recommendations-container'); };
            return container;
        },
        cards: {
            /**
             * @typedef {object} _skUICardScene
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the scene
             * @prop {string} id Scene ID
             * @prop {skUI} thumbnail Scene image preview
             * @prop {skUI} preview Scene video preview
             * @prop {skUI} specs Scene specs
             * @prop {skUI} fileSize Scene size
             * @prop {skUI} resolution Scene resolution
             * @prop {skUI} duration Scene duration
             * @prop {skUI} studio Scene studio overlay
             * @prop {skUI} studioThumbnail Scene studio image
             * @prop {string} studioPage Scene studio page
             * @prop {string} studioId Scene studio ID
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} details Scene details
             * @prop {skUI} title Scene title
             * @prop {skUI} date Scene date
             * @prop {skUI} description Scene description
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardScene} skUICardScene
             */

            /**
             * Return all scene cards
             * @returns {skUICardScene[]} Scene cards
             */
            scene: () => {
                const cards = sk.tool.getAll('.scene-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.video-section');
                    data.page = card.get('.scene-card-link').url();
                    data.id = data.page.split('scenes/')[1].split('?')[0];
                    data.thumbnail = card.get('.scene-card-preview-image');
                    data.preview = card.get('.scene-card-preview-video');
                    data.specs = card.get('.scene-specs-overlay');
                    data.fileSize = card.get('.overlay-filesize');
                    data.resolution = card.get('.overlay-resolution');
                    data.duration = card.get('.overlay-duration');
                    data.studio = card.get('.studio-overlay');
                    if (data.studio) {
                        data.studioThumbnail = data.studio.get('img');
                        data.studioPage = data.studio.get('a').url();
                        data.studioId = data.studioPage.split('studios/')[1];
                    };
                    data.infoSection = card.get('.card-section');
                    data.details = card.get('.scene-card__details');
                    data.title = card.get('h5');
                    data.date = card.get('.scene-card__date');
                    data.description = card.get('.scene-card__description');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },

            /**
             * @typedef {object} _skUICardImage
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the image
             * @prop {string} id Image ID
             * @prop {skUI} image Image preview
             * @prop {skUI} studio Image studio overlay
             * @prop {skUI} studioThumbnail Image studio thumbnail
             * @prop {skUI} studioPage Image studio page
             * @prop {skUI} studioId Image studio ID
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} details Image details
             * @prop {skUI} title Image title
             * @prop {skUI} date Image date
             * @prop {skUI} description Image description
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardImage} skUICardImage
             */

            /**
             * Return all image cards
             * @returns {skUICardImage[]} Image cards
             */
            image: () => {
                const cards = sk.tool.getAll('.image-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.thumbnail-section');
                    data.page = card.get('.image-card-link').url();
                    data.id = data.page.split('images/')[1];
                    data.image = data.previewSection.get('img');
                    data.studio = card.get('.studio-overlay');
                    if (data.studio) {
                        data.studioThumbnail = data.studio.get('img');
                        data.studioPage = data.studio.get('a').url();
                        data.studioId = data.studioPage.split('studios/')[1];
                    };
                    data.infoSection = card.get('.card-section');
                    data.details = card.get('.image-card__details');
                    data.title = card.get('h5');
                    data.date = card.get('.image-card__date');
                    data.description = card.get('.image-card__description');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },

            /**
             * @typedef {object} _skUICardGroup
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the group
             * @prop {string} id Group ID
             * @prop {skUI} image Group preview
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} details Group details
             * @prop {skUI} name Group name
             * @prop {skUI} date Group date
             * @prop {skUI} description Group description
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardGroup} skUICardGroup
             */

            /**
             * Return all group cards
             * @returns {skUICardGroup[]} Group cards
             */

            group: () => {
                const cards = sk.tool.getAll('.group-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.thumbnail-section');
                    data.page = card.get('.group-card-header').url();
                    data.id = data.page.split('groups/')[1];
                    data.image = data.previewSection.get('img');
                    data.infoSection = card.get('.card-section');
                    data.details = card.get('.group-card__details');
                    data.name = card.get('h5');
                    data.description = card.get('.group-card__description');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },

            /**
             * @typedef {object} _skUICardMarker
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the scene
             * @prop {string} id Scene ID
             * @prop {skUI} thumbnail Marker image preview
             * @prop {skUI} preview Marker video preview
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} details Marker details
             * @prop {skUI} title Marker title
             * @prop {skUI} time Marker time
             * @prop {skUI} scene Scene title
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardMarker} skUICardMarker
             */

            /**
             * Return all marker cards
             * @returns {skUICardMarker[]} Marker cards
             */

            marker: () => {
                const cards = sk.tool.getAll('.scene-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.video-section');
                    data.page = card.get('.scene-marker-card-link').url();
                    data.id = data.page.split('scenes/')[1].split('?')[0];
                    data.thumbnail = card.get('.scene-marker-card-preview-image');
                    data.preview = card.get('.scene-marker-card-preview-video');
                    data.infoSection = card.get('.card-section');
                    data.details = card.get('.scene-marker-card__details');
                    data.title = card.get('h5');
                    data.time = card.get('.scene-marker-card__time');
                    data.scene = card.get('.scene-marker-card__scene');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },

            /**
             * @typedef {object} _skUICardGallery
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the gallery
             * @prop {string} id Gallery ID
             * @prop {skUI} image Gallery preview
             * @prop {skUI} studio Gallery studio overlay
             * @prop {skUI} studioThumbnail Gallery studio thumbnail
             * @prop {skUI} studioPage Gallery studio page
             * @prop {skUI} studioId Gallery studio ID
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} details Gallery details
             * @prop {skUI} title Gallery title
             * @prop {skUI} date Gallery date
             * @prop {skUI} description Gallery description
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardGaller} skUICardGallery
             */

            /**
             * Return all gallery cards
             * @returns {skUICardGallery[]} Gallery cards
             */
            gallery: () => {
                const cards = sk.tool.getAll('.gallery-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.thumbnail-section');
                    data.page = card.get('.gallery-card-link').url();
                    data.id = data.page.split('galleries/')[1];
                    data.image = data.previewSection.get('img');
                    data.studio = card.get('.studio-overlay');
                    if (data.studio) {
                        data.studioThumbnail = data.studio.get('img');
                        data.studioPage = data.studio.get('a').url();
                        data.studioId = data.studioPage.split('studios/')[1];
                    };
                    data.infoSection = card.get('.card-section');
                    data.details = card.get('.gallery-card__details');
                    data.title = card.get('h5');
                    data.date = card.get('.gallery-card__date');
                    data.description = card.get('.gallery-card__description');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },

            /**
             * @typedef {object} _skUICardPerformer
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the performer
             * @prop {string} id Performer ID
             * @prop {skUI} image Performer thumbnail
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} name Performer name
             * @prop {skUI} disambiguation Performer disambiguation
             * @prop {skUI} flag Performer flag
             * @prop {skUI} gender Performer gender icon
             * @prop {skUI} age Performer age
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardPerformer} skUICardPerformer
             */

            /**
             * Return all performer cards
             * @returns {skUICardPerformer[]} Performer cards
             */
            performer: () => {
                const cards = sk.tool.getAll('.performer-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.thumbnail-section');
                    data.page = data.previewSection.get('a').url();
                    data.id = data.page.split('performers/')[1];
                    data.image = data.previewSection.get('img');
                    data.infoSection = card.get('.card-section');
                    data.name = card.get('.performer-name');
                    data.disambiguation = card.get('.performer-disambiguation');
                    data.flag = card.get('.performer-card__country-flag');
                    data.gender = card.get('.gender-icon');
                    data.age = card.get('.performer-card__age');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },

            /**
             * @typedef {object} _skUICardStudio
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the studio
             * @prop {string} id Studio ID
             * @prop {skUI} image Studio preview
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} details Studio details
             * @prop {skUI} name Studio name
             * @prop {skUI} child Studio child
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardStudio} skUICardStudio
             */

            /**
             * Return all studio cards
             * @returns {skUICardStudio[]} Studio cards
             */
            studio: () => {
                const cards = sk.tool.getAll('.studio-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.thumbnail-section');
                    data.page = data.previewSection.get('a').url();
                    data.id = data.page.split('studios/')[1];
                    data.image = data.previewSection.get('img');
                    data.infoSection = card.get('.card-section');
                    data.details = card.get('.studio-card__details');
                    data.name = card.get('h5');
                    data.child = card.get('.studio-child-studios');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },

            /**
             * @typedef {object} _skUICardTag
             * @prop {skUI} previewSection Preview section (top)
             * @prop {string} page Page of the tag
             * @prop {string} id Tag ID
             * @prop {skUI} image Tag preview
             * @prop {skUI} infoSection Info section (middle)
             * @prop {skUI} details Tag details
             * @prop {skUI} name Tag name
             * @prop {skUI} description Tag description
             * @prop {skUI} child Tag child
             * @prop {skUI} parent Tag parent
             */

            /**
             * @typedef {skUI & skBaseCard & _skUICardTag} skUICardTag
             */

            /**
             * Return all tag cards
             * @returns {skUICardTag[]} Tag cards
             */
            tag: () => {
                const cards = sk.tool.getAll('.tag-card');
                for (card of cards) {
                    const data = {};
                    data.previewSection = card.get('.thumbnail-section');
                    data.page = data.previewSection.get('a').url();
                    data.id = data.page.split('studios/')[1];
                    data.image = data.previewSection.get('img');
                    data.infoSection = card.get('.card-section');
                    data.details = card.get('.studio-card__details');
                    data.name = card.get('h5');
                    data.description = card.get('.tag-description');
                    data.child = card.get('.tag-sub-tags');
                    data.parent = card.get('.tag-parent-tags');
                    const info = _cardInfo(card);
                    card._data = { ...data, ...info };
                };
                return cards;
            },
            /**
             * Return tags popups element
             * @returns {skUI} Tags popups
             */
            tagsPopUps: () => { return sk.tool.getAll('.tag-item') }
        },
        page: {
            /**
             * Get details element of the scene page
             * @returns {object} Scene page
             */
            scene: () => {
                const data = {};
                const ratingStar = sk.tool.get('.star-rating-number');
                const ratingDecimal = sk.tool.get('.rating-number span');
                data.id = window.location.pathname.split('/')[2];
                data.info = sk.tool.get('.scene-tabs');
                data.header = sk.tool.get('.scene-header-container');
                data.studio = sk.tool.get('.scene-studio-image');
                data.title = sk.tool.get('.scene-header');
                data.subHeader = sk.tool.get('.scene-subheader');
                data.date = data.subHeader.get('.date');
                data.frameRate = sk.tool.get('.frame-rate');
                data.resolution = sk.tool.get('.resolution');
                data.toolbar = sk.tool.get('.scene-toolbar');
                data.navbar = sk.tool.get('.nav.nav-tabs');
                data.createdAt = sk.tool.getAll('.scene-details h6')[0];
                data.updatedAt = sk.tool.getAll('.scene-details h6')[1];
                data.tags = sk.tool.getAll('.tag-item[data-sort-name]');
                data.performers = sk.tool.getAll('.performer-card');
                data.queueList = sk.tool.getAll('#queue-content li');
                data.markersCard = sk.tool.get('.scene-markers-panel div');
                data.markersPreview = sk.tool.getAll('.scene-markers-panel .wall');
                data.groups = sk.tool.getAll('.group-card');
                data.playCount = sk.tool.get('.play-history span.badge');
                data.oCount = sk.tool.get('.o-history span.badge');
                data.divider = sk.tool.get('.scene-divider');
                data.player = sk.tool.get('.scene-player-container');
                data.playerControls = data.player.get('.vjs-control-bar');
                data.rating = ratingStar.element ? ratingStar : ratingDecimal;
                /**
                 * Create a custom tab and return it. (link id - skPPT_{name}, container id - skPPTC_{name})
                 * @param {string} name Tab name
                 * @param {function} [callback] Function to run on tab click
                 * @returns {skUI} Custom tab content
                 */
                data.navbar.add = (name, callback) => {
                    const aC = make.container({ id: `skPPT_${name}`, class: 'nav-item', style: { cursor: 'pointer' } });
                    const a = make.link({ text: name, class: 'nav-link', attribute: { role: 'tab' } });
                    aC.append(a);
                    const div = make.container({ id: `skPPTC_${name}`, class: 'fade tab-pane', attribute: { role: 'tabpanel' } });
                    aC.event({
                        type: 'click', callback: () => {
                            data.navbar.get('.nav-link.active').class('active');
                            sk.tool.get('.fade.tab-pane.active.show').class('active show');
                            a.class('active');
                            div.class('active show');
                            if (callback) callback(div);
                        }
                    });
                    data.navbar.append(aC);
                    sk.tool.get('.tab-content').append(div);
                    data.navbar.getAll('.nav-item').forEach((tab) => {
                        if (tab.id() === aC.id()) return;
                        tab.event({
                            type: 'click', callback: () => {
                                if (a.class().includes('active')) a.class('active');
                                if (div.class().includes('active')) div.class('active show');
                            }
                        });
                    });
                    return div;
                };
                return data;
            },
            /**
             * Get details element of the image page
             * @returns {object} Image page
             */
            image: () => {
                const data = {};
                const ratingStar = sk.tool.get('.star-rating-number');
                const ratingDecimal = sk.tool.get('.rating-number span');
                data.id = window.location.pathname.split('/')[2];
                data.info = sk.tool.get('.image-tabs');
                data.header = sk.tool.get('.image-header-container');
                data.studio = sk.tool.get('.image-studio-image');
                data.title = sk.tool.get('.image-header');
                data.subHeader = sk.tool.get('.image-subheader');
                data.date = data.subHeader.get('.date');
                data.resolution = sk.tool.get('.resolution');
                data.toolbar = sk.tool.get('.image-toolbar');
                data.navbar = sk.tool.get('.nav.nav-tabs');
                data.galleries = sk.tool.getAll('.image-details .tag-item');
                data.createdAt = sk.tool.getAll('.image-details h6')[0];
                data.updatedAt = sk.tool.getAll('.image-details h6')[1];
                data.tags = sk.tool.getAll('.tag-item[data-sort-name]');
                data.performers = sk.tool.getAll('.performer-card');
                data.image = sk.tool.get('.image-container');
                data.rating = ratingStar.element ? ratingStar : ratingDecimal;
                /**
                 * Create a custom tab and return it. (link id - skPPT_{name}, container id - skPPTC_{name})
                 * @param {string} name Tab name
                 * @param {function} [callback] Function to run on tab click
                 * @returns {skUI} Custom tab content
                 */
                data.navbar.add = (name, callback) => {
                    const aC = make.container({ id: `skPPT_${name}`, class: 'nav-item', style: { cursor: 'pointer' } });
                    const a = make.link({ text: name, class: 'nav-link', attribute: { role: 'tab' } });
                    aC.append(a);
                    const div = make.container({ id: `skPPTC_${name}`, class: 'fade tab-pane', attribute: { role: 'tabpanel' } });
                    aC.event({
                        type: 'click', callback: () => {
                            data.navbar.get('.nav-link.active').class('active');
                            sk.tool.get('.fade.tab-pane.active.show').class('active show');
                            a.class('active');
                            div.class('active show');
                            if (callback) callback(div);
                        }
                    });
                    data.navbar.append(aC);
                    sk.tool.get('.tab-content').append(div);
                    data.navbar.getAll('.nav-item').forEach((tab) => {
                        if (tab.id() === aC.id()) return;
                        tab.event({
                            type: 'click', callback: () => {
                                if (a.class().includes('active')) a.class('active');
                                if (div.class().includes('active')) div.class('active show');
                            }
                        });
                    });
                    return div;
                };
                return data;
            },
            /**
             * Get details element of the group page
             * @returns {object} Group page
             */
            group: () => {
                const data = {};
                const ratingStar = sk.tool.get('.star-rating-number');
                const ratingDecimal = sk.tool.get('.rating-number span');
                data.id = window.location.pathname.split('/')[2];
                data.background = sk.tool.get('.background-image-container');
                data.info = sk.tool.get('.detail-container');
                data.headers = sk.tool.get('.detail-header-image');
                data.image = sk.tool.get('img.group');
                data.name = sk.tool.get('.group-name');
                data.details = sk.tool.get('.detail-group');
                data.buttons = sk.tool.get('.details-edit');
                data.customFields = sk.tool.get('.custom-fields');
                data.navbar = sk.tool.get('.nav.nav-tabs');
                data.tabContent = sk.tool.get('.tab-content');
                data.rating = ratingStar.element ? ratingStar : ratingDecimal;
                /**
                 * Get a detail
                 * @param {string} name Detail name
                 * @returns {string} Detail value
                 */
                data.getDetails = (name) => {
                    name = name.toLowerCase();
                    return data.details.get(`.detail-item-value.${name}`).read();
                };
                /**
                 * Create a custom tab and return it. (link id - skPPT_{name}, container id - skPPTC_{name})
                 * @param {string} name Tab name
                 * @param {function} [callback] Function to run on tab click
                 * @returns {skUI} Custom tab content
                 */
                data.navbar.add = (name, callback) => {
                    const a = make.link({
                        text: name, id: `skPPT_${name}`, class: 'nav-item nav-link', attribute: { role: 'tab' }, style: { cursor: 'pointer' }
                    });
                    const div = make.container({ id: `skPPTC_${name}`, class: 'fade tab-pane', attribute: { role: 'tabpanel' } });
                    a.event({
                        type: 'click', callback: () => {
                            data.navbar.get('.nav-link.active').class('active');
                            sk.tool.get('.fade.tab-pane.active.show').class('active show');
                            a.class('active');
                            div.class('active show');
                            if (callback) callback(div);
                        }
                    });
                    data.navbar.append(a);
                    sk.tool.get('.tab-content').append(div);
                    sk.tool.getAll('.nav-item.nav-link').forEach((tab) => {
                        if (tab.id() === a.id()) return;
                        tab.event({
                            type: 'click', callback: () => {
                                if (a.class().includes('active')) a.class('active');
                                if (div.class().includes('active')) div.class('active show');
                            }
                        });
                    });
                    return div;
                };
                return data;
            },
            /**
             * Get details element of the gallery page
             * @returns {object} Gallery page
             */
            gallery: () => {
                const data = {};
                const ratingStar = sk.tool.get('.star-rating-number');
                const ratingDecimal = sk.tool.get('.rating-number span');
                data.id = window.location.pathname.split('/')[2];
                data.info = sk.tool.get('.gallery-tabs');
                data.header = sk.tool.get('.gallery-header-container');
                data.studio = sk.tool.get('.gallery-studio-image');
                data.title = sk.tool.get('.gallery-header');
                data.subHeader = sk.tool.get('.gallery-subheader');
                data.date = data.subHeader.get('.date');
                data.toolbar = sk.tool.get('.gallery-toolbar');
                data.navbar = sk.tool.get('.nav.nav-tabs');
                data.createdAt = sk.tool.getAll('.gallery-details h6')[0];
                data.updatedAt = sk.tool.getAll('.gallery-details h6')[1];
                data.tags = sk.tool.getAll('.tag-item[data-sort-name]');
                data.performers = sk.tool.getAll('.performer-card');
                data.divider = sk.tool.get('.scene-divider');
                data.rating = ratingStar.element ? ratingStar : ratingDecimal;
                /**
                 * Create a custom tab and return it. (link id - skPPT_{name}, container id - skPPTC_{name})
                 * @param {string} name Tab name
                 * @param {function} [callback] Function to run on tab click
                 * @returns {skUI} Custom tab content
                 */
                data.navbar.add = (name, callback) => {
                    const aC = make.container({ id: `skPPT_${name}`, class: 'nav-item', style: { cursor: 'pointer' } });
                    const a = make.link({ text: name, class: 'nav-link', attribute: { role: 'tab' } });
                    aC.append(a);
                    const div = make.container({ id: `skPPTC_${name}`, class: 'fade tab-pane', attribute: { role: 'tabpanel' } });
                    aC.event({
                        type: 'click', callback: () => {
                            data.navbar.get('.nav-link.active').class('active');
                            sk.tool.get('.fade.tab-pane.active.show').class('active show');
                            a.class('active');
                            div.class('active show');
                            if (callback) callback(div);
                        }
                    });
                    data.navbar.append(aC);
                    sk.tool.get('.tab-content').append(div);
                    data.navbar.getAll('.nav-item').forEach((tab) => {
                        if (tab.id() === aC.id()) return;
                        tab.event({
                            type: 'click', callback: () => {
                                if (a.class().includes('active')) a.class('active');
                                if (div.class().includes('active')) div.class('active show');
                            }
                        });
                    });
                    return div;
                };
                return data;
            },
            /**
             * Get details element of the performer page
             * @returns {object} Performer page
             */
            performer: () => {
                const data = {};
                const isFavorite = sk.tool.get('.favorite');
                const notFavorite = sk.tool.get('.not-favorite');
                const ratingStar = sk.tool.get('.star-rating-number');
                const ratingDecimal = sk.tool.get('.rating-number span');
                data.id = window.location.pathname.split('/')[2];
                data.background = sk.tool.get('.background-image-container');
                data.info = sk.tool.get('.detail-container');
                data.headers = sk.tool.get('.detail-header-image');
                data.image = sk.tool.get('img.performer');
                data.name = sk.tool.get('.performer-name');
                data.disambiguation = sk.tool.get('.performer-disambiguation');
                data.details = sk.tool.get('.detail-group');
                data.buttons = sk.tool.get('.details-edit');
                data.customFields = sk.tool.get('.custom-fields');
                data.navbar = sk.tool.get('.nav.nav-tabs');
                data.tabContent = sk.tool.get('.tab-content');
                data.favorite = isFavorite.element ? isFavorite : notFavorite;
                data.rating = ratingStar.element ? ratingStar : ratingDecimal;
                /**
                 * Get a detail
                 * @param {string} name Detail name
                 * @returns {string} Detail value
                 */
                data.getDetails = (name) => {
                    name = name.toLowerCase();
                    return data.details.get(`.detail-item-value.${name}`).read();
                };
                /**
                 * Get a custom field
                 * @param {string} name Custom field name
                 * @returns {string} Custom field value
                 */
                data.getCustomField = (name) => {
                    if (!data.customFields) return;
                    name = name.toLowerCase();
                    let field = data.customFields.get(`.detail-item-value.${name}`);
                    if (!field) field = data.customFields.get(`.detail-item-value.custom-field-${name}`); // DEV BRANCH FIX
                    return field ? field.read() : '';
                };
                /**
                 * Create a custom tab and return it. (link id - skPPT_{name}, container id - skPPTC_{name})
                 * @param {string} name Tab name
                 * @param {function} [callback] Function to run on tab click
                 * @returns {skUI} Custom tab content
                 */
                data.navbar.add = (name, callback) => {
                    const a = make.link({
                        text: name, id: `skPPT_${name}`, class: 'nav-item nav-link', attribute: { role: 'tab' }, style: { cursor: 'pointer' }
                    });
                    const div = make.container({ id: `skPPTC_${name}`, class: 'fade tab-pane', attribute: { role: 'tabpanel' } });
                    a.event({
                        type: 'click', callback: () => {
                            data.navbar.get('.nav-link.active').class('active');
                            sk.tool.get('.fade.tab-pane.active.show').class('active show');
                            a.class('active');
                            div.class('active show');
                            if (callback) callback(div);
                        }
                    });
                    data.navbar.append(a);
                    sk.tool.get('.tab-content').append(div);
                    sk.tool.getAll('.nav-item.nav-link').forEach((tab) => {
                        if (tab.id() === a.id()) return;
                        tab.event({
                            type: 'click', callback: () => {
                                if (a.class().includes('active')) a.class('active');
                                if (div.class().includes('active')) div.class('active show');
                            }
                        });
                    });
                    return div;
                };
                return data;
            },
            /**
             * Get details element of the studio page
             * @returns {object} Studio page
             */
            studio: () => {
                const data = {};
                const isFavorite = sk.tool.get('.favorite');
                const notFavorite = sk.tool.get('.not-favorite');
                const ratingStar = sk.tool.get('.star-rating-number');
                const ratingDecimal = sk.tool.get('.rating-number span');
                data.id = window.location.pathname.split('/')[2];
                data.background = sk.tool.get('.background-image-container');
                data.info = sk.tool.get('.detail-container');
                data.headers = sk.tool.get('.detail-header-image');
                data.image = sk.tool.get('img.group');
                data.name = sk.tool.get('.studio-name');
                data.details = sk.tool.get('.detail-group');
                data.buttons = sk.tool.get('.details-edit');
                data.customFields = sk.tool.get('.custom-fields');
                data.navbar = sk.tool.get('.nav.nav-tabs');
                data.tabContent = sk.tool.get('.tab-content');
                data.favorite = isFavorite.element ? isFavorite : notFavorite;
                data.rating = ratingStar.element ? ratingStar : ratingDecimal;
                /**
                 * Get a detail
                 * @param {string} name Detail name
                 * @returns {string} Detail value
                 */
                data.getDetails = (name) => {
                    name = name.toLowerCase();
                    return data.details.get(`.detail-item-value.${name}`).read();
                };
                /**
                 * Create a custom tab and return it. (link id - skPPT_{name}, container id - skPPTC_{name})
                 * @param {string} name Tab name
                 * @param {function} [callback] Function to run on tab click
                 * @returns {skUI} Custom tab content
                 */
                data.navbar.add = (name, callback) => {
                    const a = make.link({
                        text: name, id: `skPPT_${name}`, class: 'nav-item nav-link', attribute: { role: 'tab' }, style: { cursor: 'pointer' }
                    });
                    const div = make.container({ id: `skPPTC_${name}`, class: 'fade tab-pane', attribute: { role: 'tabpanel' } });
                    a.event({
                        type: 'click', callback: () => {
                            data.navbar.get('.nav-link.active').class('active');
                            sk.tool.get('.fade.tab-pane.active.show').class('active show');
                            a.class('active');
                            div.class('active show');
                            if (callback) callback(div);
                        }
                    });
                    data.navbar.append(a);
                    sk.tool.get('.tab-content').append(div);
                    sk.tool.getAll('.nav-item.nav-link').forEach((tab) => {
                        if (tab.id() === a.id()) return;
                        tab.event({
                            type: 'click', callback: () => {
                                if (a.class().includes('active')) a.class('active');
                                if (div.class().includes('active')) div.class('active show');
                            }
                        });
                    });
                    return div;
                };
                return data;
            },
            /**
             * Get details element of the tag page
             * @returns {object} Tag page
             */
            tag: () => {
                const data = {};
                const isFavorite = sk.tool.get('.favorite');
                const notFavorite = sk.tool.get('.not-favorite');
                const ratingStar = sk.tool.get('.star-rating-number');
                const ratingDecimal = sk.tool.get('.rating-number span');
                data.id = window.location.pathname.split('/')[2];
                data.background = sk.tool.get('.background-image-container');
                data.info = sk.tool.get('.detail-container');
                data.headers = sk.tool.get('.detail-header-image');
                data.image = sk.tool.get('img.group');
                data.name = sk.tool.get('.tag-name');
                data.details = sk.tool.get('.detail-group');
                data.buttons = sk.tool.get('.details-edit');
                data.customFields = sk.tool.get('.custom-fields');
                data.navbar = sk.tool.get('.nav.nav-tabs');
                data.tabContent = sk.tool.get('.tab-content');
                data.favorite = isFavorite.element ? isFavorite : notFavorite;
                data.rating = ratingStar.element ? ratingStar : ratingDecimal;
                /**
                 * Get a detail
                 * @param {string} name Detail name
                 * @returns {string} Detail value
                 */
                data.getDetails = (name) => {
                    name = name.toLowerCase();
                    return data.details.get(`.detail-item-value.${name}`).read();
                };
                /**
                 * Create a custom tab and return it. (link id - skPPT_{name}, container id - skPPTC_{name})
                 * @param {string} name Tab name
                 * @param {function} [callback] Function to run on tab click
                 * @returns {skUI} Custom tab content
                 */
                data.navbar.add = (name, callback) => {
                    const a = make.link({
                        text: name, id: `skPPT_${name}`, class: 'nav-item nav-link', attribute: { role: 'tab' }, style: { cursor: 'pointer' }
                    });
                    const div = make.container({ id: `skPPTC_${name}`, class: 'fade tab-pane', attribute: { role: 'tabpanel' } });
                    a.event({
                        type: 'click', callback: () => {
                            data.navbar.get('.nav-link.active').class('active');
                            sk.tool.get('.fade.tab-pane.active.show').class('active show');
                            a.class('active');
                            div.class('active show');
                            if (callback) callback(div);
                        }
                    });
                    data.navbar.append(a);
                    sk.tool.get('.tab-content').append(div);
                    sk.tool.getAll('.nav-item.nav-link').forEach((tab) => {
                        if (tab.id() === a.id()) return;
                        tab.event({
                            type: 'click', callback: () => {
                                if (a.class().includes('active')) a.class('active');
                                if (div.class().includes('active')) div.class('active show');
                            }
                        });
                    });
                    return div;
                };
                return data;
            }
        }
    };
    // UI creator
    const make = {
        /**
         * Create a preset popUp
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Popup
         */
        popUp: (options = {}) => {
            for (key in options.style) { options.style[key] = options.style[key].toString(); };
            const style = options.style;
            style.position = style.position || 'fixed';
            style.width = style.width || '75%';
            style.height = style.height || '50%';
            style.top = style.top || '25%';
            style['z-index'] = style['z-index'] || 9999;
            style['text-align'] = style['text-align'] || 'center';
            options.style = style;
            return skGraphicBase('div', options);
        },
        /**
         * Create a container
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Container
         */
        container: (options = {}) => { return skGraphicBase('div', options) },

        /**
         * Create a divider
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Divider
         */
        divider: (options = {}) => { return skGraphicBase('hr', options) },

        /**
         * Create a title
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Title
         */
        title: (options = {}) => { return skGraphicBase('h1', options) },

        /**
         * Create a sub title
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Sub title
         */
        subTitle: (options = {}) => { return skGraphicBase('h3', options) },

        /**
         * Create a span
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Span
         */
        span: (options = {}) => { return skGraphicBase('span', options) },

        /**
         * Create a description
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Description
         */
        description: (options = {}) => { return skGraphicBase('p', options) },

        /**
         * Create a list item
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} List item
         */
        li: (options = {}) => { return skGraphicBase('li', options) },

        /**
         * Create a unordered list
         * @param {skUIOptions} [options={}] skUI options
         * @param {array.<string>} [li=[]] List item text
         * @param {skUIOptions} [liOptions={}] skUI options for every list item
         * @returns {skUI} Unordered list
         */
        ulist: (options = {}, li = [], liOptions = {}) => {
            const ul = skGraphicBase('ul', options);
            li.forEach((item) => {
                liOptions.text = item;
                ul.append(skGraphicBase('li', liOptions));
            });
            return ul;
        },

        /**
         * Create a anchor
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Anchor
         */
        link: (options = {}) => { return skGraphicBase('a', options) },

        /**
         * Create a image
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Image
         */
        image: (options = {}) => { return skGraphicBase('img', options) },

        /**
         * Create a video
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Video
         */
        video: (options = {}) => { return skGraphicBase('video', options) },

        /**
         * Create a button
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Button
         */
        button: (options = {}) => { return skGraphicBase('button', options) },

        /**
         * Create a checkbox
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Checkbox
         */
        checkBox: (options = {}) => {
            if (!options.attribute) options.attribute = {};
            options.attribute.type = 'checkbox';
            return skGraphicBase('input', options);
        },

        /**
         * Create a input
         * @param {skUIOptions} [options={}] skUI options
         * @returns {skUI} Input
         */
        input: (options = {}) => { return skGraphicBase('input', options) }
    };

    return { is, get, make };
}();

//BOOKMARK skStash

/**
  * Create and return the Stash module
  * @returns {object} skStash module
  */
sk.stash = function skStash() {
    /**
     * Return Stash configuration
     * @returns {object} Stash configuration
     */
    const configuration = () => { return window.__APOLLO_CLIENT__.cache.data.data.ROOT_QUERY.configuration; };
    // User server url
    const _server = `${window.location.protocol}//${window.location.host}`;
    // Default headers for GQL
    const _defaulHeaders = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ApiKey: configuration().general.ApiKey || ''
        }
    };
    // Avaiable query
    const _query = {
        find: 'query {find@uppercase@(@filters@){@category@{@fields@}}}',
        update: 'mutation @singular@Update($input:@sUppercase@UpdateInput!){@singular@Update(input:$input){id}}',
        bulkUpdate: 'mutation bulk@uppercase@Update($input:Bulk@uppercase@UpdateInput!){bulk@uppercase@Update(input:$input){ids}}',
        create: 'mutation @singular@Create($input:@sUppercase@CreateInput!){@singular@Create(input:$input){id}}'
    };
    // Avaiable fields
    const _fields = {
        scenes: 'id title code details director urls date rating100 organized o_counter interactive interactive_speed captions {language_code caption_type} created_at updated_at last_played_at resume_time play_duration play_count play_history o_history files {id path basename mod_time size format width height duration video_codec audio_codec frame_rate bit_rate created_at updated_at} paths {screenshot preview stream webp vtt sprite funscript interactive_heatmap caption} scene_markers {@sceneMarkers@} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@} stash_ids {@stashID@} sceneStreams {url mime_type label}',
        images: 'id title code rating100 urls date details photographer o_counter organized created_at updated_at paths {thumbnail preview image} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@}',
        groups: 'id name aliases duration date rating100 studio {@studios@} director synopsis urls tags {@tags@} created_at updated_at containing_groups { group {@groups@} description } sub_groups { group {@groups@} description } front_image_path back_image_path scene_count performer_count sub_group_count scenes {@scenes@} o_counter',
        sceneMarkers: 'id scene {@scenes@} title seconds end_seconds primary_tag {@tags@} tags {@tags@} created_at updated_at stream preview screenshot',
        galleries: 'id title code urls date details photographer rating100 organized created_at updated_at files {id path basename mod_time size created_at updated_at} folder {@folder@} chapters {id  gallery {@galleries@} title image_index created_at updated_at} scenes {@scenes@} studio {@studios@} image_count tags {@tags@} performers {@performers@} cover {id title code rating100 urls date details photographer o_counter organized created_at updated_at paths {@imagePath@} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@}} paths {cover preview}',
        performers: 'id name disambiguation urls gender birthdate ethnicity country eye_color height_cm measurements fake_tits penis_length circumcised career_length tattoos piercings alias_list favorite tags {@tags@} ignore_auto_tag image_path scene_count image_count gallery_count group_count performer_count o_counter scenes {@scenes@} stash_ids {@stashID@} rating100 details death_date hair_color weight created_at updated_at groups {@groups@} custom_fields',
        studios: 'id name urls parent_studio {@studios@} child_studios {@studios@} aliases tags {@tags@} ignore_auto_tag image_path scene_count image_count gallery_count group_count stash_ids {@stashID@} rating100 favorite details created_at updated_at groups {@groups@} o_counter',
        tags: 'id name sort_name description aliases ignore_auto_tag created_at updated_at favorite stash_ids {@stashID@} image_path scene_count scene_marker_count image_count gallery_count performer_count studio_count group_count parent_count child_count parents {@tags@} children {@tags@}',
        folder: 'id path parent_folder {@folder@} mod_time created_at updated_at',
        stashID: 'endpoint stash_id updated_at',
        _id: 'id',
        _stashID: 'stashs_id'
    };

    /**
     * Send a request to graphql
     * @async
     * @param {string} query Query or mutation
     * @param {object} [input={}] Input to send
     * @returns {object} Result data
     */
    const _gql = async (query, input = {}) => {
        let configuration = _defaulHeaders;
        if (input._type === 'stashDB') input = await sk.stashDB.toStash(input);
        configuration.body = JSON.stringify({ query: query, variables: { input: input } });
        const response = await fetch(`${_server}/graphql`, configuration);
        let result = await response.json();
        return result.data;
    };

    /**
     * @typedef {object} skStashFilters Stash filter object
     * @prop {string} [fields] Fields to retrieve, default all. Ex. 'id title'
     * @prop {object} [filter] Request filter
     * @prop {string} [filter.q] Search
     * @prop {number} [filter.per_page] Max result
     * @prop {object} [fieldFilter] Specific category filter
     * @prop {array.<number>} [ids] IDs to get
     */

    /**
     * Format the placeholder query
     * @param {object} data Request data
     * @param {string} data.action find/update/bulkUpdate/create
     * @param {string} data.category scenes/images/groups/sceneMarkers/galleries/performers/studios/tags
     * @param {string} data.singular Singular version of category
     * @param {string} data.uppercase Capitalized category
     * @param {string} data.sUppercase Capitalized singular
     * @param {skStashFilters} [configuration={}] Request filters
     * @returns {string} Full query
     */
    const _formatQuery = (data, configuration = {}) => {
        let { action, category, singular, uppercase, sUppercase } = data;
        if (!configuration.filter) configuration.filter = { q: '', per_page: -1 };
        if (!isNaN(configuration.filter.q) && configuration.filter.q !== '') {
            configuration.ids = [configuration.filter.q];
            configuration.filter.q = '';
        };
        const search = configuration.filter.q;
        let query = _query[action];

        let filterName;
        if (category === 'galleries') filterName = 'gallery_filter';
        if (category === 'sceneMarkers') filterName = 'scene_marker_filter';
        if (!filterName) filterName = `${singular}_filter`;

        let filterList;
        if (configuration.filter) filterList = `filter:${JSON.stringify(configuration.filter)}`;
        if (configuration.fieldFilter) filterList += `,${filterName}:${JSON.stringify(configuration.fieldFilter)}`;
        if (configuration.ids) filterList += `,ids:${JSON.stringify(configuration.ids)}`;
        filterList = filterList.replaceAll('"', '').replace(`q:${search}`, `q:"${search}"`);
        if (filterList.includes("'")) filterList = filterList.replaceAll("'", '"');

        let fields = configuration.fields;
        if (fields && !fields.includes('id')) fields = `${fields} id`;
        if (!fields && action === 'find') {
            fields = _fields[category];
            for (fieldType in _fields) { if (fields.includes(`@${fieldType}@`)) fields = fields.replaceAll(`@${fieldType}@`, _fields[fieldType]); };
            for (fieldType in _fields) {
                if (fields.includes(`@${fieldType}@`)) {
                    const stop = _fields[`_${fieldType}`];
                    fields = stop ? fields.replaceAll(`@${fieldType}@`, stop) : fields.replaceAll(`@${fieldType}@`, _fields._id);
                };
            };
        };
        query = query.replaceAll('@uppercase@', uppercase);
        query = query.replaceAll('@sUppercase@', sUppercase);
        query = query.replaceAll('@category@', category);
        query = query.replaceAll('@singular@', singular);
        query = query.replace('@filters@', filterList);
        query = query.replace('@fields@', fields);
        return query;
    };

    /**
     * Prepare the query and send the request to graphql
     * @async
     * @param {string} action find/update/bulkUpdate/create
     * @param {string} category scenes/images/groups/sceneMarkers/galleries/performers/studios/tags
     * @param {skStashFilters} [configuration={}] Request filters
     * @param {object} input
     * @returns {object} Result data
     */
    const _do = async (action, category, configuration = {}, input) => {
        const data = {
            action: action,
            category: category,
            singular: category.substring(0, category.length - 1),
            uppercase: category[0].toUpperCase() + category.slice(1),
            sUppercase: category[0].toUpperCase() + category.substring(0, category.length - 1).slice(1)
        };
        const query = _formatQuery(data, configuration);
        const response = await _gql(query, input);
        let result;
        if (action === 'find') result = response[action + data.uppercase][category];
        if (action === 'bulkUpdate') result = response[`bulk${data.sUppercase}Update`];
        if (action === 'update') result = response[`${data.singular}Update`];
        if (action === 'create') result = response[`${data.singular}Create`];
        if (configuration.ids && configuration.ids.length === 1) result = result.filter((entry) => { if (entry.id === configuration.ids[0]) return entry });
        return result;
    };

    // Find query
    const find = {
        /**
         * @typedef {object} stashID Stash id
         * @param {string} endpoint Stash id endpoint
         * @param {string} stash_id Stash id name
         * @param {date} updated_at Stash id updated date
         */

        /**
         * @typedef {object} stashFolder Stash folder
         * @prop {number} id Folder id
         * @prop {string} path Folder path
         * @prop {stashFolder} parent_folder Folder parent folder
         * @prop {stashBasicFile} zip_file Folder zip
         * @prop {date} mod_time Folder mod time
         * @prop {date} created_at Folder creation date
         * @prop {date} updated_at Folder updated date
         */

        /**
         * @typedef {object} stashBaseFile Stash base file constructor
         * @prop {number} id File id
         * @prop {string} path File path
         * @prop {string} basename File basename
         * @prop {stashFolder} parent_folder File parent folder
         * @prop {stashBasicFile} zip_file File zip
         * @prop {date} mod_time File mod time
         * @prop {number} size File size
         * @prop {object[]} fingerprints File fingerprints
         * @prop {string} fingerprints[].type Fingerprint type
         * @prop {string} fingerprints[].value Fingerprint value
         * @prop {date} created_at File creation date
         * @prop {date} updated_at File updated date
         */

        /**
         * @typedef {stashBaseFile} stashBasicFile Stash basic file
         */

        /**
         * @typedef {stashBaseFile} stashGalleryFile Stash Gallery file
         */

        /**
         * @typedef {object} _stashImageFile Stash Image File
         * @prop {string} format Image format
         * @prop {number} width Image width
         * @prop {number} height Image height
         */

        /**
         * @typedef {stashBaseFile & _stashImageFile} stashImageFile Stash image file
         */
        
        /**
         * @typedef {object} _stashVideoFile Stash Video file
         * @param {string} format Video format
         * @param {number} width Video width
         * @param {number} height Video height
         * @param {number} duration Video duration
         * @param {string} video_codec Video codec
         * @param {string} audio_codec Video audio codec
         * @param {number} frame_rate Video frame rate
         * @param {number} bit_rate Video bit rate
         */

        /**
         * @typedef {stashBaseFile & _stashVideoFile} stashVideoFile Stash video file
         */
        
        /**
         * @typedef {object} stashScene Stash scene
         * @prop {number} id Scene ID
         * @prop {string} title Scene title
         * @prop {string} code Scene code
         * @prop {string} details Scene details
         * @prop {string} director Scene director
         * @prop {array.<string>} urls Scene urls
         * @prop {string} date Scene date
         * @prop {number} rating100 Scene rating
         * @prop {boolean} organized If the scene is organized
         * @prop {number} o_counter Scene o-counter
         * @prop {boolean} interactive If the scene is interactive
         * @prop {number} interactive_speed Scene interactive speed
         * @prop {object[]} captions Scene captions
         * @prop {string} captions[].language_code Caption language code
         * @prop {string} captions[].caption_type Caption type
         * @prop {date} created_at Scene creation date
         * @prop {date} updated_at Scene updated date
         * @prop {date} last_played_at Scene last played date
         * @prop {number} resume_time Scene time index was left at
         * @prop {number} play_duration Scene total spent time 
         * @prop {number} play_count Scene play count
         * @prop {array.<date>} play_history  Scene play history
         * @prop {array.<date>} o_history Scene o-counter history
         * @prop {stashVideoFile[]} files Scene files
         * @prop {object} paths Scene paths
         * @prop {string} paths.screenshot Screenshot path
         * @prop {string} paths.preview Preview path
         * @prop {string} paths.stream Stream path
         * @prop {string} paths.webp WEBP path
         * @prop {string} paths.vtt VTT path
         * @prop {string} paths.sprite Sprite path
         * @prop {string} paths.funscript Funscript path
         * @prop {string} paths.interactive_heatmap Interactive heatmap path
         * @prop {string} paths.caption Caption path
         * @prop {stashSceneMarker[]} scene_markers Scene markers
         * @prop {stashGalleries[]} galleries Scene galleries
         * @prop {stashStudio} studio Scene studio
         * @prop {stashGroup[]} groups Scene groups
         * @prop {stashTag[]} tags Scene tags
         * @prop {stashPerformer[]} performers Scene performers
         * @prop {stashID[]} stash_ids Scene Stash ids
         * @prop {object[]} sceneStreams Valid scene streams
         * @prop {string} sceneStreams[].url Scene stream url
         * @prop {string} sceneStreams[].mime_type Scene stream mime type
         * @prop {string} sceneStreams[].label Scene stream label  
         */

        /**
         * Find scenes
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashScene[]} Response data
         */
        scenes: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'scenes', configuration);
            response._category = 'scene';
            return response;
        },
        /**
         * Find scene
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashScene} Response data
         */
        scene: async (configuration) => {
            if (typeof configuration === 'string' && isNaN(configuration)) configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.scenes(configuration);
            return response[0];
        },

        /**
         * @typedef {object} stashImage Stash image
         * @prop {number} id Image id
         * @prop {string} title Image title
         * @prop {string} code Image code
         * @prop {number} rating100 Image rating
         * @prop {array.<string>} Image Image urls
         * @prop {string} date Image date
         * @prop {string} details Image details
         * @prop {string} photographer Image photographer
         * @prop {number} o_counter Image o-counter
         * @prop {boolean} organized If the image is organized
         * @prop {date} created_at Image creation date
         * @prop {date} updated_at Image updated date
         * @prop {stashImageFile[]|stashVideoFile[]} visual_files Image files
         * @prop {object} paths Image paths
         * @prop {string} paths.thumbnail Thumbnail paths
         * @prop {string} paths.preview Preview paths
         * @prop {string} paths.image Image path
         * @prop {stashGallery[]} galleries Image galleries
         * @prop {stashStudio} studio Image studio
         * @prop {stashTag[]} tags Image tags
         * @prop {stashPerformer[]} performers Image performers
         */

        /**
         * Find images
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashImage[]} Response data
         */
        images: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'images', configuration);
            return response;
        },
        /**
         * Find image
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashImage} Response data
         */
        image: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.images(configuration);
            return response[0];
        },

        /**
         * @typedef {object} stashGroupDescription Stash group description
         * @prop {stashGroup} group Group
         * @prop {string} description Group description
         */

        /**
         * @typedef {object} stashGroup Stash group
         * @prop {number} id Group id
         * @prop {string} name Group name
         * @prop {string} aliases Group aliases
         * @prop {number} duration Group total video duration (s)
         * @prop {string} date Group date
         * @prop {number} rating100 Group rating
         * @prop {stashStudio} studio Group studio
         * @prop {string} director Group director
         * @prop {string} synopsis Group synopsis
         * @prop {array.<string>} urls Group urls
         * @prop {stashTag[]} tags Group tags
         * @prop {date} created_at Group creation time
         * @prop {date} updated_at Group updated time
         * @prop {stashGroupDescription[]} containing_groups Containing groups
         * @prop {stashGroupDescription[]} sub_groups Sub groups
         * @prop {string} front_image_path Group front cover
         * @prop {string} back_image_path Group back cover
         * @prop {stashScene[]} scenes Group scenes
         * @prop {number} o_counter Group o-counter
         */

        /**
         * Find groups
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashGroup[]} Response data
         */
        groups: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'groups', configuration);
            return response;
        },
        /**
         * Find group
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashGroup} Response data
         */
        group: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.groups(configuration);
            return response[0];
        },

        /**
         * @typedef {object} stashSceneMarker Stash scene marker
         * @prop {number} id Marker id
         * @prop {string} title Marker title
         * @prop {number} seconds Marker start time
         * @prop {number} end_seconds Marker end time
         * @prop {stashTag} primary_tag Marker main tag
         * @prop {stashTag[]} tags Marker tags
         * @prop {date} created_at Marker creation date
         * @prop {date} updated_at Marker updated date
         * @prop {string} stream Marker stream path
         * @prop {string} preview Marker preview path
         * @prop {string} screenshot Marker screenshot path
         */

        /**
         * Find scene markers
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashSceneMarker[]} Response data
         */
        markers: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'sceneMarkers', configuration);
            return response;
        },
        /**
         * Find scene marker
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashSceneMarker} Response data
         */
        marker: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.markers(configuration);
            return response[0];
        },

        /**
         * @typedef {object} stashGallery Stash gallery
         * @prop {number} id Gallery id
         * @prop {string} title Gallery title
         * @prop {string} code Gallery code
         * @prop {array.<string>} urls Gallery urls
         * @prop {string} date Gallery date
         * @prop {string} details Gallery details
         * @prop {string} photographer Gallery photographer
         * @prop {number} rating100 Gallery rating
         * @prop {boolean} organized If the gallery is organized
         * @prop {date} created_at Gallery creation date
         * @prop {date} updated_at Gallery updated date
         * @prop {stashGalleryFile[]} files Gallery files
         * @prop {stashFolder} folder Gallery folder
         * @prop {object[]} chapters Gallery chapters
         * @prop {number} chapters[].id Gallery chapter id
         * @prop {stashGallery} chapters[].gallery Gallery chapter
         * @prop {string} chapters[].title Gallery chapter title
         * @prop {number} chapters[].image_index Gallery chapter image index
         * @prop {date} chapters[].created_at Gallery chapter creation date
         * @prop {date} chapters[].updated_at Gallery chapter update date
         * @prop {stashScene[]} scenes Gallery scenes
         * @prop {stashStudio} studio Gallery studio
         * @prop {number} image_count Gallery total image
         * @prop {stashTag[]} tags Gallery tags
         * @prop {stashPerformer[]} performers Gallery performers
         * @prop {stashImage} cover Gallery cover
         * @prop {object} paths Gallery paths
         * @prop {string} paths.cover Gallery cover path
         * @prop {string} paths.preview Gallery preview path
         */

        /**
         * Find galleries
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashGallery[]} Response data
         */
        galleries: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'galleries', configuration);
            return response;
        },
        /**
         * Find gallery
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashGallery} Response data
         */
        gallery: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.galleries(configuration);
            return response[0];
        },

        /**
         * @typedef {object} stashPerformer Stash performer
         * @prop {number} id Performer id
         * @prop {string} name Performer name
         * @prop {string} disambiguation Performer disambiguation
         * @prop {array.<string>} urls Performer urls
         * @prop {string} gender Performer gender (MALE|FEMALE|TRANSGENDER_MALE|TRANSGENDER_FEMALE|INTERSEX|NON_BINARY)
         * @prop {string} birthday Performer birthday
         * @prop {string} ethnicity Performer ethnicity
         * @prop {string} county Performer country (abbreviation, ex: IT, JP, AO)
         * @prop {string} eye_color Performer eyes color
         * @prop {number} height_cm Performer height
         * @prop {string} measurements Performer measurements
         * @prop {string} fake_tits Performer fake tits
         * @prop {number} penis_length Performer penis length
         * @prop {string} circumcised Performer circumcised (CUT|UNCUT)
         * @prop {number} career_start Performer career start
         * @prop {number} career_end Performer career end
         * @prop {string} tattoos Performer tattoos
         * @prop {string} piercings Performer piercings
         * @prop {array.<string>} alias_list Performer aliases
         * @prop {boolean} favorite If the performer is favorite
         * @prop {stashTag[]} tags Performer tags
         * @prop {boolean} ignore_auto_tag If the performer will be ignored during auto tagging
         * @prop {string} image_path Performer image path
         * @prop {number} scene_count Performer scenes count
         * @prop {number} image_count Performer images count
         * @prop {number} gallery_count Performer galleries count
         * @prop {number} group_count Performer groups count
         * @prop {number} performer_count Performer appear with performers count
         * @prop {number} o_counter Performer o-counter
         * @prop {stashScene[]} scenes Performer scenes
         * @prop {stashID[]} stash_ids Performer Stash ids
         * @prop {number} rating100 Performer rating
         * @prop {string} details Performer details
         * @prop {string} death_date Performer death date
         * @prop {string} hair_color Performer hairs color
         * @prop {number} weight Performer weight (kg)
         * @prop {date} created_at Performer creation date
         * @prop {date} updated_at Performer updated date
         * @prop {stashGroup[]} groups Performer groups
         * @prop {object} custom_fields Performer custom fields
         */

        /**
         * Find performers
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashPerformer[]} Response data
         */
        performers: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'performers', configuration);
            return response;
        },
        /**
         * Find performer
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashPerformer} Response data
         */
        performer: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.performers(configuration);
            return response[0];
        },

        /**
         * @typedef {object} stashStudio Stash studio
         * @prop {number} id Studio id
         * @prop {string} name Studio name
         * @prop {array.<string>} urls Studio urls
         * @prop {stashStudio} parent_studio Studio parent
         * @prop {stashStudio[]} child_studios Studio children
         * @prop {array.<string>} aliases Studio aliases
         * @prop {stashTag[]} tags Studio tags
         * @prop {boolean} ignore_auto_tag If the studio will be ignored during auto tagging
         * @prop {boolean} organized If the studio is organized
         * @prop {string} image_path Studio image path
         * @prop {stashID[]} stash_ids Studio Stash ids
         * @prop {number} rating100 Studio rating
         * @prop {boolean} favorite If studio is favorite
         * @prop {string} details Studio details
         * @prop {date} created_at Studio creation date
         * @prop {date} updated_at Studio updated date
         * @prop {stashGroup[]} groups Studio groups
         * @prop {number} o_counter Studio o-counter
         * @prop {object} custom_fields Studio custom fields
         */

        /**
         * Find studios
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashStudio[]} Response data
         */
        studios: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'studios', configuration);
            return response;
        },
        /**
         * Find studio
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashStudio} Response data
         */
        studio: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.studios(configuration);
            return response[0];
        },

        /**
         * @typedef {object} stashTag Stash tag
         * @prop {number} id Tag id
         * @prop {string} name Tag name
         * @prop {string} sort_name Tag sort name
         * @prop {string} descritpion Tag description
         * @prop {array.<string>} aliases Tag aliases
         * @prop {boolean} ignore_auto_tag If the tag will be ignored during auto tagging
         * @prop {date} created_at Tag creation date
         * @prop {date} updated_at Tag updated date
         * @prop {boolean} favorite If the tag is favorite
         * @prop {stashID[]} stash_ids Tag Stash ids
         * @prop {string} image_path Tag image path
         * @prop {stashTag[]} parents Tag parent tags
         * @prop {stashTag[]} children Tag children tags
         * @prop {number} parent_count Tag parent count
         * @prop {number} child_count Tag children count
         * @prop {object} custom_fields Tag custom fields
         */

        /**
         * Find tags
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashTag[]} Response data
         */
        tags: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            const response = await _do('find', 'tags', configuration);
            return response;
        },
        /**
         * Find tag
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {stashTag} Response data
         */
        tag: async (configuration) => {
            if (typeof configuration === 'string') configuration = { filter: { q: configuration } };
            if (typeof configuration === 'string' && !isNaN(configuration)) configuration = { ids: [configuration] };
            if (!configuration.filter) configuration.filter = {};
            configuration.filter.per_page = 1;
            const response = await find.tags(configuration);
            return response[0];
        }
    };
    // Update mutation
    const update = {
        /**
         * @typedef {object} stashCustomFieldsUpdate Stash custom fields input
         * @prop {object} full Scene custom fields (replace all)
         * @prop {object} partial Scene custom fields (replace only same key)
         * @prop {array.<string>} remove Scene custom fields (remove same key)
         */

        /**
         * @typedef {object} stashBulkUpdateIds
         * @prop {array.<number>|array.<string>} ids Update ids
         * @prop {string} mode SET|ADD|REMOVE
         */

        /**
         * @typedef {object} stashBulkUpdateStrings
         * @prop {array.<string>} values Object values
         * @prop {string} mode SET|ADD|REMOVE
         */

        /**
         * @typedef {object} stashSceneBulkUpdate Stash scenes bulk update input
         * @prop {string} [clientMutationId] Client mutation id
         * @prop {array.<number>|array.<string>} ids Scenes ids to update
         * @prop {string} [title] Scenes title
         * @prop {string} [code] Scenes code
         * @prop {string} [details] Scenes details
         * @prop {string} [director] Scenes director
         * @prop {stashBulkUpdateStrings[]} [urls] Scenes urls
         * @prop {string} date Scenes date
         * @prop {number} rating100 Scenes rating
         * @prop {boolean} organized If the scenes are organized
         * @prop {number|string} studio_id Scenes studio id
         * @prop {stashBulkUpdateIds} galelery_ids Scenes galleries ids
         * @prop {stashBulkUpdateIds} performer_ids Scenes performers ids
         * @prop {stashBulkUpdateIds} tag_ids Scenes tags ids
         * @prop {stashBulkUpdateIds} group_ids Scenes groups ids
         * @prop {stashCustomFieldsUpdate} custom_fields Scenes custom fields
         */

        /**
         * Update scenes
         * @async
         * @param {stashSceneBulkUpdate} input New data
         * @returns {stashScene[]} Response data
         */
        scenes: async (input) => {
            const response = await _do('bulkUpdate', 'scenes', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashSceneUpdate Stash scene update input
         * @prop {string} [clientMutationId] Client mutation id
         * @prop {number|string} id Scene id to update
         * @prop {string} [title] Scene title
         * @prop {string} [code] Scene code
         * @prop {string} [details] Scene details
         * @prop {string} [director] Scene director
         * @prop {array.<string>} [urls] Scene urls
         * @prop {string} [date] Scene date
         * @prop {number} [rating100] Scene rating
         * @prop {number} [o_counter] Scene o-counter
         * @prop {boolean} [organized] If the scene is organized
         * @prop {number|string} [studio_id] Scene studio id
         * @prop {array.<number>|array.<string>} [gallery_ids] Scene galleries ids
         * @prop {array.<number>|array.<string>} [performer_ids] Scene performers ids
         * @prop {object[]} [groups] Scene groups
         * @prop {string|number} groups[].group_id Scene group id
         * @prop {number} groups[].scene_index Scene group index
         * @prop {array.<number>|array.<string>} [tag_ids] Scene tags ids
         * @prop {Base64URLString|string} [cover_image] Scene cover image (URL|base64 encoded date URL)
         * @prop {stashID[]} [stash_ids] Scene Stash ids
         * @prop {number} [resume_time] Scene time index was left
         * @prop {number} [play_duration] Scene total time spent playing
         * @prop {number} [play_count] Scene total play count
         * @prop {number|string} [primary_file_id] Scene primary file id
         * @prop {stashCustomFieldsUpdate} [custom_fields] Scene custom fields
         */

        /**
         * Update scene
         * @async
         * @param {stashSceneUpdate} input New data
         * @returns {stashScene} Response data
         */
        scene: async (input) => {
            const response = await _do('update', 'scenes', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashImageBulkUpdate Stash images bulk update input
         * @prop {string} [clientMutationId] Client Mutation id
         * @prop {array.<number>|array.<string>} ids Images ids to update
         * @prop {string} [title] Images title
         * @prop {string} [code] Images code
         * @prop {number} [rating100] Images rating
         * @prop {boolean} [organized] If the images are organized
         * @prop {stashBulkUpdateStrings[]} [urls] Images urls
         * @prop {string} [date] Images date
         * @prop {string} [details] Images details
         * @prop {string} [photographer] Images photographer
         * @prop {number|string} [studio_id] Images studio id
         * @prop {stashBulkUpdateIds} [performer_ids] Images performers ids
         * @prop {stashBulkUpdateIds} [tag_ids] Images tags ids
         * @prop {stashBulkUpdateIds} [gallery_ids] Images galleries ids
         * @prop {stashCustomFieldsUpdate} [custom_fields] Images custom fields
         */

        /**
         * Update images
         * @async
         * @param {stashImageBulkUpdate} input New data
         * @returns {stashImage[]} Response data
         */
        images: async (input) => {
            const response = await _do('bulkUpdate', 'images', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashImageUpdate Stash image update input
         * @prop {string} [clientMutationId] Client mutation id
         * @prop {number|string} id Image id to update
         * @prop {string} [title] Image title
         * @prop {string} [code] Image code
         * @prop {number} [rating100] Image rating
         * @prop {boolean} [organized] If the image is organized
         * @prop {stashBulkUpdateStrings} [urls] Image urls
         * @prop {string} [date] Image date
         * @prop {string} [details] Image details
         * @prop {string} [photographer] Image photographer
         * @prop {number|string} [studio_id] Image studio id
         * @prop {array.<number>|array.<string>} [performer_ids] Image performers ids
         * @prop {array.<number>|array.<string>} [gallery_ids] Image galleries ids
         * @prop {number|string} [primary_file_id] Image primary file id
         * @prop {stashCustomFieldsUpdate} [custom_fields] Image custom fields
         */

        /**
         * Update image
         * @async
         * @param {stashImageUpdate} input New data
         * @returns {stashImage} Response data
         */
        image: async (input) => {
            const response = await _do('update', 'images', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashGroupDescriptionUpdate Stash group description update
         * @prop {stashGroupDescription[]} groups Groups description
         * @prop {string} mode SET|ADD|REMOVE
         */

        /**
         * @typedef {object} stashGroupBulkUpdate Stash group bulk update input
         * @prop {string} [clientMutationId] Client mutation id
         * @prop {array.<number>|array.<string>} ids Groups ids to update
         * @prop {number} [rating100] Groups rating
         * @prop {number|string} [studio_id] Groups studio id
         * @prop {string} [director] Groups director
         * @prop {stashBulkUpdateStrings} [urls] Groups urls
         * @prop {stashBulkUpdateIds} [tag_ids] Groups tags ids
         * @prop {stashGroupDescriptionUpdate} [containing_groups] Groups parents
         * @prop {stashGroupDescriptionUpdate} [sub_groups] Groups children
         * @prop {stashCustomFieldsUpdate} [custom_fields] Groups custom fields
         */

        /**
         * Update groups
         * @async
         * @param {stashGroupBulkUpdate} input New data
         * @returns {stashGroup[]} Response data
         */
        groups: async (input) => {
            const response = await _do('bulkUpdate', 'groups', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashGroupUpdate Stash group update input
         * @prop {number|string} id Group id
         * @prop {string} [name] Group name
         * @prop {string} [aliases] Group aliases
         * @prop {number} [duration] Group duration
         * @prop {string} [date] Group date
         * @prop {number} [rating100] Group rating
         * @prop {number|string} [studio_id] Group studio id
         * @prop {string} [director] Group director
         * @prop {string} [synopsis] Group synopsis
         * @prop {array.<string>} [urls] Group urls
         * @prop {array.<number>|array.<string>} [tag_ids] Group tags ids
         * @prop {stashGroupDescriptionUpdate[]} [containing_groups] Group parents
         * @prop {stashGroupDescriptionUpdate[]} [sub_groups] Group children
         * @prop {string} [front_image] Group front cover
         * @prop {string} [back_image] Group back cover
         * @prop {stashCustomFieldsUpdate} [custom_fields] Group custom fields
         */

        /**
         * Update group
         * @async
         * @param {stashGroupUpdate} input New data
         * @returns {stashGroup} Response data
         */
        group: async (input) => {
            const response = await _do('update', 'groups', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashSceneMarkerBulkUpdate Stash scene markers bulk update input
         * @prop {array.<number>|array.<string>} ids Markers ids to update
         * @prop {string} [title] Markers title
         * @prop {number|string} [primary_file_id] Markers primary file id
         * @prop {stashBulkUpdateIds} [tag_ids] Markers tags ids 
         */

        /**
         * Update scene markers
         * @async
         * @param {stashSceneMarkerBulkUpdate} input New data
         * @returns {stashSceneMarker[]} Response data
         */
        markers: async (input) => {
            const response = await _do('bulkUpdate', 'sceneMarkers', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashSceneMarkerUpdate Stash scene marker update input
         * @prop {number|string} id Marker id
         * @prop {string} [title] Marker title
         * @prop {number} [seconds] Marker start seconds
         * @prop {number} [end_seconds] Marker end seconds
         * @prop {number|string} [scene_id] Marker scene id
         * @prop {number|string} [primary_tag_id] Marker primary file id
         * @prop {array.<number>|array.<string>} [tag_ids] Marker tags ids
         */

        /**
         * Update scene marker
         * @async
         * @param {stashSceneMarkerUpdate} input New data
         * @returns {stashSceneMarker} Response data
         */
        marker: async (input) => {
            const response = await _do('update', 'sceneMarkers', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashGalleryBulkUpdate Stash galleries bulk update input
         * @prop {string} [clientMutationId] Client mutation id
         * @prop {array.<number>|array.<string>} ids Galleries ids to update
         * @prop {string} [code] Galleries code
         * @prop {stashBulkUpdateStrings} [urls] Galleries urls
         * @prop {string} [date] Galleries date
         * @prop {string} [details] Galleries details
         * @prop {string} [photographer] Galleries photographer
         * @prop {number} [rating100] Galleries rating
         * @prop {boolean} [organized] If galleries are organized
         * @prop {stashBulkUpdateIds} [scene_ids] Galleries scenes ids
         * @prop {number|string} [studio_id] Galleries studio id
         * @prop {stashBulkUpdateIds} [tag_ids] Galleries tags ids
         * @prop {stashBulkUpdateIds} [performer_ids] Galleries performers ids
         * @prop {stashCustomFieldsUpdate} [custom_fields] Galleries custom fields
         */

        /**
         * Update galleries
         * @async
         * @param {stashGalleryBulkUpdate} input New data
         * @returns {stashGallery[]} Response data
         */
        galleries: async (input) => {
            const response = await _do('bulkUpdate', 'galleries', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashGalleryUpdate Stash gallery update input
         * @prop {string} [clientMutationId] Client mutation id
         * @prop {number|string} id Gallery id
         * @prop {string} [title] Gallery title
         * @prop {string} [code] Gallery code
         * @prop {array.<string>} [urls] Gallery urls
         * @prop {string} [date] Gallery date
         * @prop {string} [details] Gallery details
         * @prop {string} [photographer] Gallery photographer
         * @prop {number} [rating100] Gallery rating
         * @prop {boolean} [organized] If the gallery is organized
         * @prop {array.<number>|array.<string>} [scene_ids] Gallery scenes ids
         * @prop {number|string} [studio_id] Gallery studio id
         * @prop {array.<number>|array.<string>} [tag_ids] Gallery tags ids
         * @prop {number|string} [primary_file_id] Gallery primary file id
         */

        /**
         * Update gallery
         * @async
         * @param {stashGalleryUpdate} input New data
         * @returns {stashGallery} Response data
         */
        gallery: async (input) => {
            const response = await _do('update', 'galleries', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashPerformerBulkUpdate Stash performer bulk update input
         * @prop {string} [clientMutationId] Client mutation id
         * @prop {array.<number>|array.<string>} ids Performers ids to update
         * @prop {stashBulkUpdateStrings} [urls] Performers urls
         * @prop {string} [gender] MALE|FEMALE|TRANSGENDER_MALE|TRANSGENDER_FEMALE|INTERSEX|NON_BINARY
         * @prop {string} [birthdate] Performers birthdate
         * @prop {string} [ethnicity] Performers ethnicity
         * @prop {string} [country] Performers country (abbreviation ex. IT, JP)
         * @prop {string} [eye_color] Performers eyes color
         * @prop {number} [height_cm] Performers height
         * @prop {string} [measurements] Performers measurements
         * @prop {string} [fake_tits] Performers fake tits
         * @prop {number} [penis_length] Performers penis length
         * @prop {string} [circumcised] Performers CUT|UNCUT
         * @prop {string} [career_length] Performers career length
         * @prop {string} [tattoos] Performers tattoos
         * @prop {string} [piercings] Performers piercings
         * @prop {stashBulkUpdateStrings} [alias_list] Performers aliases
         * @prop {boolean} [favorite] If performers are favorite
         * @prop {stashBulkUpdateIds} [tag_ids] Performers tags ids
         * @prop {number} [rating100] Performers rating
         * @prop {string} [details] Performers details
         * @prop {string} [death_date] Performers death date
         * @prop {string} [hair_color] Performers hairs color
         * @prop {number} [weight] Performers weight (kg)
         * @prop {boolean} [ignore_auto_tag] If performers will be ignored during autotagging
         * @prop {stashCustomFieldsUpdate} [custom_fields] Performers custom fields
         */

        /**
         * Update performers
         * @async
         * @param {stashPerformerBulkUpdate} input New data
         * @returns {stashPerformer[]} Response data
         */
        performers: async (input) => {
            const response = await _do('bulkUpdate', 'performers', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashPerformerUpdate Stash performer update input
         * @prop {number|string} id Performer id to update
         * @prop {string} [name] Performer name
         * @prop {string} [disambiguation] Performer disambiguation
         * @prop {stashBulkUpdateStrings} [urls] Performer urls
         * @prop {string} [gender] MALE|FEMALE|TRANSGENDER_MALE|TRANSGENDER_FEMALE|INTERSEX|NON_BINARY
         * @prop {string} [birthdate] Performer birthdate
         * @prop {string} [ethnicity] Performer ethnicity
         * @prop {string} [country] Performer country (abbreviation ex. IT, JP)
         * @prop {string} [eye_color] Performer eyes color
         * @prop {number} [height_cm] Performer height
         * @prop {string} [measurements] Performer measurements
         * @prop {string} [fake_tits] Performer fake tits
         * @prop {number} [penis_length] Performer penis length
         * @prop {string} [circumcised] Performer CUT|UNCUT
         * @prop {string} [career_length] Performer career length
         * @prop {string} [tattoos] Performer tattoos
         * @prop {string} [piercings] Performer piercings
         * @prop {array.<string>} [alias_list] Performer aliases
         * @prop {boolean} [favorite] If performer is favorite
         * @prop {stashBulkUpdateIds} [tag_ids] Performer tags ids
         * @prop {string} [image] Performer image
         * @prop {stashID[]} [stash_ids] Performer Stash id
         * @prop {number} [rating100] Performer rating
         * @prop {string} [details] Performer details
         * @prop {string} [death_date] Performer death date
         * @prop {string} [hair_color] Performer hairs color
         * @prop {number} [weight] Performer weight (kg)
         * @prop {boolean} [ignore_auto_tag] If performer will be ignored during autotagging
         * @prop {stashCustomFieldsUpdate} [custom_fields] Performer custom fields
         */

        /**
         * Update performer
         * @async
         * @param {stashPerformerUpdate} input New data
         * @returns {stashPerformer} Response data
         */
        performer: async (input) => {
            const response = await _do('update', 'performers', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashStudioBulkUpdate Stash studios bulk update input
         * @prop {array.<number>|array.<string>} ids Studios ids to update
         * @prop {stashBulkUpdateStrings} [urls] Studios urls
         * @prop {number|string} [parent_id] Studios parent id
         * @prop {number} [rating100] Studios rating
         * @prop {boolean} [favorite] If studios are favorite
         * @prop {string} [details] Studios details
         * @prop {stashBulkUpdateIds} [tag_ids] Studios tags ids
         * @prop {boolean} [ignore_auto_tag] If studios will be ignored during autotagging
         */

        /**
         * Update studios
         * @async
         * @param {stashStudioBulkUpdate} input New data
         * @returns {stashStudio[]} Response data
         */
        studios: async (input) => {
            const response = await _do('bulkUpdate', 'studios', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashStudioUpdate Stash studio update input
         * @prop {number|string} id Studio id to update
         * @prop {stashBulkUpdateStrings} [urls] Studio urls
         * @prop {number|string} [parent_id] Studio parent id
         * @prop {string} [image] Studio image
         * @prop {stashID[]} [stash_ids] Studio stash ids
         * @prop {number} [rating100] Studio rating
         * @prop {boolean} [favorite] If studio is favorite
         * @prop {string} [details] Studio details
         * @prop {array.<string>} [aliases] Studio aliases
         * @prop {stashBulkUpdateIds} [tag_ids] Studio tags ids
         * @prop {boolean} [ignore_auto_tag] If studio will be ignored during autotagging
         */

        /**
         * Update studio
         * @async
         * @param {stashStudioUpdate} input New data
         * @returns {stashStudio} Response data
         */
        studio: async (input) => {
            const response = await _do('update', 'studios', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashTagBulkUpdate Stash tags bulk update input
         * @prop {array.<number>|array.<string>} ids Tags ids to update
         * @prop {string} [description] Tags description
         * @prop {stashBulkUpdateStrings} [aliases] Tags aliases
         * @prop {boolean} [ignore_auto_tag] If tags will be ignored during autotagging
         * @prop {boolean} [favorite] If tags are favorite
         * @prop {stashBulkUpdateIds} [parent_ids] Tags parent ids
         * @prop {stashBulkUpdateIds} [child_ids] Tags children ids
         */

        /**
         * Update tags
         * @async
         * @param {stashTagBulkUpdate} input New data
         * @returns {stashTag[]} Response data
         */
        tags: async (input) => {
            const response = await _do('bulkUpdate', 'tags', undefined, input);
            return response;
        },

        /**
         * @typedef {object} stashTagUpdate Stash tag  update input
         * @prop {number|string} id Tag id to update
         * @prop {string} [name] Tag name
         * @prop {string} [sort_name] Tag sort name
         * @prop {string} [description] Tag description
         * @prop {array.<string>} [aliases] Tag aliases
         * @prop {boolean} [ignore_auto_tag] If tag will be ignored during autotagging
         * @prop {boolean} [favorite] If tag is favorite
         * @prop {string} [image] Tag image
         * @prop {stashID} [stash_ids] Tag Stash ids
         * @prop {stashBulkUpdateIds} [parent_ids] Tag parent ids
         * @prop {stashBulkUpdateIds} [child_ids] Tag children ids
         */

        /**
         * Update tag
         * @async
         * @param {stashTagUpdate} input New data
         * @returns {stashTag} Response data
         */
        tag: async (input) => {
            const response = await _do('update', 'tags', undefined, input);
            return response;
        }
    };
    // Create mutation
    const create = {
        /**
         * Create scene
         * @async
         * @param {stashSceneUpdate} input New data
         * @returns {stashScene} Response data
         */
        scene: async (input) => {
            const response = await _do('create', 'scenes', undefined, input);
            return response;
        },
        /**
         * Update image
         * @async
         * @param {stashImageUpdate} input New data
         * @returns {stashImage} Response data
         */
        image: async (input) => {
            const response = await _do('create', 'images', undefined, input);
            return response;
        },
        /**
         * Update group
         * @async
         * @param {stashGroupUpdate} input New data
         * @returns {stashGroup} Response data
         */
        group: async (input) => {
            const response = await _do('create', 'groups', undefined, input);
            return response;
        },
        /**
         * Update scene marker
         * @async
         * @param {stashSceneMarkerUpdate} input New data
         * @returns {stashSceneMarker} Response data
         */
        marker: async (input) => {
            const response = await _do('create', 'sceneMarkers', undefined, input);
            return response;
        },
        /**
         * Update gallery
         * @async
         * @param {stashGalleryUpdate} input New data
         * @returns {stashGallery} Response data
         */
        gallery: async (input) => {
            const response = await _do('create', 'galleries', undefined, input);
            return response;
        },
        /**
         * Update performer
         * @async
         * @param {stashPerformerUpdate} input New data
         * @returns {stashPerformer} Response data
         */
        performer: async (input) => {
            const response = await _do('create', 'performers', undefined, input);
            return response;
        },
        /**
         * Update studio
         * @async
         * @param {stashStudioUpdate} input New data
         * @returns {stashStudio} Response data
         */
        studio: async (input) => {
            const response = await _do('create', 'studios', undefined, input);
            return response;
        },
        /**
         * Update tag
         * @async
         * @param {stashTagUpdate} input New data
         * @returns {stashTag} Response data
         */
        tag: async (input) => {
            const response = await _do('create', 'tag', undefined, input);
            return response;
        }
    };

    /**
     * @typedef {object} stashBox Stash box
     * @prop {string} api_key Stash box api key
     * @prop {string} endpoint Stash box endpoint
     * @prop {number} max_requests_per_minute Stash box max requests per minute
     * @prop {string} name Stash box name
     */

    /**
     * Return stashBox with the given name
     * @param {string} name StashBox name
     * @returns {stashBox} StashBox
     */
    const getStashBox = (name) => {
        let find = false;
        const stashBoxes = configuration().general.stashBoxes;
        for (stashBox of stashBoxes) { if (stashBox.name.toLowerCase() === name.toLowerCase()) find = stashBox; };
        return find;
    };

    return { configuration, find, update, create, getStashBox };
}();

//BOOKMARK skStashDB

/**
  * Create and return the StashDB module
  * @returns {object} skStashDB module
  */
sk.stashDB = function skStashDB() {
    const _configuration = sk.stash.getStashBox('stashdb');
    const _server = _configuration.endpoint;
    const _defaulHeaders = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ApiKey: _configuration.api_key || ''
        }
    };
    const _query = {
        base: 'query SearchAll($term:String!,$limit:Int=5){@categoryQuery@}',
        scene: 'searchScene(term:$term,limit:$limit){@scene@}',
        studio: 'searchStudio(term:$term,limit:$limit){@studio@}',
        performer: 'searchPerformer(term:$term,limit:$limit){@performer@}',
        tag: 'searchTag(term:$term,limit:$limit){@tag@}'
    };
    const _fields = {
        scene: 'id code release_date production_date title details director urls { url } images { url } studio {@studio@} performers { performer {@performer@} } tags {@tag@}',
        studio: 'id name aliases urls { url } parent { name } child_studios { name }',
        performer: 'id name disambiguation aliases gender birth_date death_date age height hair_color eye_color ethnicity country career_end_year career_start_year breast_type waist_size hip_size band_size cup_size tattoos { location description } piercings { location description } urls { url } images { url }',
        tag: 'id name description aliases'
    };

    /**
     * Check if the StashDB endpoint is setted
     * @returns {boolean}
     */
    const canUse = () => {
        if (!_configuration) return false;
        return true;
    };

    /**
     * @typedef {object} stashDBFilter StashDB filter object
     * @prop {string} term Search
     * @prop {number} [limit] Max result
     */

    /**
     * Send a request to stashDB
     * @async
     * @param {string} query Query
     * @param {stashDBFilter} options Results filter
     * @returns {object} Result data
     */
    const _gql = async (query, options) => {
        let configuration = _defaulHeaders;
        configuration.body = JSON.stringify({ query: query, variables: options });
        const response = await fetch(_server, configuration);
        let result = await response.json();
        result._type = 'stashDB';
        return result.data;
    };

    /**
     * Format the placeholder query
     * @param {string} category scene/studio/performer/tag
     * @returns {string} Full query
     */
    const _formatQuery = (category) => {
        let query = _query.base;
        let categoryQuery = _query[category];
        query = query.replace('@categoryQuery@', categoryQuery);
        for (field in _fields) { if (query.includes(`@${field}@`)) query = query.replaceAll(`@${field}@`, _fields[field]) };
        for (field in _fields) { if (query.includes(`@${field}@`)) query = query.replaceAll(`@${field}@`, _fields[field]) };
        return query;
    };

    /**
     * Prepare the query and send a request to stashDB
     * @async
     * @param {string} category scene/studio/performer/tag
     * @param {stashDBFilter} options Results filter
     * @returns {boolean|object} Response data or return void if the endpoint is not setted
     */
    const _do = async (category, options) => {
        if (!canUse) {
            sk.tool.notify('StashDB endpoint is not setted');
            return;
        };
        const uppercase = category[0].toUpperCase() + category.slice(1);
        const query = _formatQuery(category);
        const response = await _gql(query, options);
        return response[`search${uppercase}`];
    };

    //Find query
    const find = {
        /**
         * Find scenes
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBScene} Result data, default 10
         */
        scenes: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            if (!options.limit) options.limit = 10;
            let response = await _do('scene', options);
            respose._category = 'scene';
            return response;
        },
        /**
         * Find scene
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBScene} Result data
         */
        scene: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            options.limit = 1;
            let response = await _do('scene', options);
            if (response[0]) response[0]._category = 'scene';
            return response[0];
        },
        /**
         * Find performers
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBPerformer} Result data, default 10
         */
        performers: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            if (!options.limit) options.limit = 10;
            let response = await _do('performer', options);
            respose._category = 'performer';
            return response;
        },
        /**
         * Find performer
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBPerformer} Result data
         */
        performer: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            options.limit = 1;
            let response = await _do('performer', options);
            if (response[0]) response[0]._category = 'performer';
            return response[0];
        },
        /**
         * Find studios
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBStudio} Result data, default 10
         */
        studios: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            if (!options.limit) options.limit = 10;
            let response = await _do('studio', options);
            respose._category = 'studio';
            return response;
        },
        /**
         * Find studio
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBStudio} Result data
         */
        studio: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            options.limit = 1;
            let response = await _do('studio', options);
            if (response[0]) response[0]._category = 'studio';
            return response[0];
        },
        /**
         * Find tags
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBTags} Result data, default 10
         */
        tags: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            if (!options.limit) options.limit = 10;
            let response = await _do('tag', options);
            respose._category = 'tag';
            return response;
        },
        /**
         * Find tag
         * @async
         * @param {stashDBFilter|string} options Results filter or search
         * @returns {stashDBTags} Result data
         */
        tag: async (options = {}) => {
            if (typeof options === 'string') options = { term: options };
            options.limit = 1;
            let response = await _do('tag', options);
            if (response[0]) response[0]._category = 'tag';
            return response[0];
        }
    };

    /**
     * @typedef {object} stashDBScene StashDB scene data
     * @prop {string} [id] Scene StashDB id
     * @prop {string} [title] Scene title
     * @prop {object[]} [images] Scene images
     * @prop {string|number} [code] Scene code
     * @prop {string} [details] Scene details
     * @prop {string} [director] Scene director
     * @prop {object[]} [urls] Scene urls data
     * @prop {string} [release_date] Scene release date (yyyy-mm-dd)
     * @prop {object} [studio] Scene studio
     * @prop {object[]} [performers] Scene performers
     * @prop {object[]} [tags] Scene tags
     */

    /**
     * @typedef {object} stashDBPerformer StashDB performer data
     * @prop {string} [id] StashDB performer id
     * @prop {string} [name] Performer name
     * @prop {string} [disambiguation] Performer disambiguation
     * @prop {object[]} [urls] Performer urls data
     * @prop {string} [gender] Performer gender
     * @prop {string} [birth_date] Performer birth date (yyyy-mm-dd)
     * @prop {string} [ethnicity] Performer ethnicity
     * @prop {string} [country] Performer country code
     * @prop {string} [eye_color] Performer eyes color
     * @prop {number} [height] Performer height in cm
     * @prop {number} [band_size] Performer band size
     * @prop {string} [cup_size] Performer cup size
     * @prop {number} [waist_size] Performer waist size
     * @prop {number} [hip_size] Performer hip size
     * @prop {string} [breast_type] Performer breast type natural|augmented
     * @prop {number} [penis_length] Performer penis length in cm
     * @prop {string} [circumcised] Performer circumcised cut|uncut
     * @prop {string} [career_start_year] Performer career starting year
     * @prop {string} [career_end_year] Performer career ending year
     * @prop {object[]} [tattoos] Performer tattoos list
     * @prop {object[]} [piercings] Performer piercings list
     * @prop {array.<string>} [aliases] Performer aliases list
     * @prop {string} [death_date] Performer death date (yyyy-mm-dd)
     * @prop {string} [hair_color] Performer hair color
     * @prop {number} [weight] Performer weight in kg
     */

    /**
     * @typedef {object} stashDBStudio StashDB studio data
     * @prop {string} [id] StashDB studio id
     * @prop {string} [name] Studio name
     * @prop {array.<string>} [aliases] Studio aliases list
     * @prop {object[]} [url] Studio urls data
     * @prop {object} [parent] Studio parent object
     */

    /**
     * @typedef {object} stashDBTags StashDB tag data
     * @prop {string} [id] StashDB tag id
     * @prop {string} [name] Tag name
     * @prop {string} [description] Tag description
     * @prop {array.<string>} [aliases] Tag aliases list
     */

    // Getter & creator for existing data on Stash
    const _get = {
        /**
         * Find existing performers
         * @async
         * @param {stashDBPerformer[]} performers Performers data
         * @param {boolean} [create] If true create missing data
         */
        performers: async (performers, create) => {
            if (!performers) return;
            let ids = { find: [], missing: [] };
            for (performer of performers) {
                performer = performer.performer;
                let find = false;
                find = await sk.stash.find.performer(performer.name);
                if (!find) for (alias of performer.aliases) { if (!find) find = await sk.stash.find.performer(alias); };
                if (!find && create) {
                    const newPerformer = await _toStash.performer(performer);
                    find = await sk.stash.create.performer({ name: newPerformer });
                };
                find ? ids.find.push(find.id) : ids.missing.push(performer);
            };
            return ids;
        },
        /**
         * Find existing studio
         * @async
         * @param {stashDBStudio} studio Studio data
         * @param {boolean} [create] If true create missing data
         */
        studio: async (studio, create) => {
            if (!studio) return studio;
            let find = false;
            find = await sk.stash.find.studio(studio.name);
            if (!find) for (alias of studio.aliases) { if (!find) find = await sk.stash.find.studio(alias); };
            if (!find && create) {
                const newStudio = await _toStash.studio(newStudio, { create: true });
                find = await sk.stash.create.studio({ name: newStudio });
            };
            return find;
        },
        /**
         * Find existing tags
         * @async
         * @param {stashDBTags[]} tags Tags data
         * @param {boolean} [create] If true create missing data
         */
        tags: async (tags, create) => {
            if (!tags) return;
            let ids = { find: [], missing: [] };
            for (tag of tags) {
                let find = false;
                find = await sk.stash.find.tag(tag.name);
                if (!find) for (alias of tag.aliases) { if (!find) find = await sk.stash.find.tag(alias); };
                if (!find && create) {
                    const newTag = await _toStash.tag(tag);
                    find = await sk.stash.create.tag({ name: newTag });
                };
                find ? ids.find.push(find.id) : ids.missing.push(tag);
            };
            return ids;
        },
        /**
         * Return a stash urls
         * @param {object[]} urls StashDB urls
         * @returns {array.<string>} Stash urls
         */
        urls: (urls) => {
            let stashUrls = [];
            urls.forEach((url) => { urls.push(url.url) });
            return stashUrls;
        },
        /**
         * Return a stash tattoos/piercings description
         * @param {object[]} list StashDB tattoos/piercings
         * @return {string} Stash tattoos/piercings description
         */
        tattosPiercings: (list) => {
            if (!list) return;
            let data = [];
            list.forEach((entry) => {
                let value;
                const description = entry.description;
                const location = entry.location;
                if (description && location) value = `${description} (${location})`;
                if (description || location && !value) value = description || location;
                data.push(value);
            });
            return data.join(', ');
        },
        /**
         * Return a stash_id
         * @param {string} id StashDB id
         * @return {object[]} List of stash_id
         */
        stashId: (id) => {
            const date = new Date();
            return [{ stash_id: id, endpoint: _server, updated_at: date.toISOString() }];
        }
    };
    // Transform StashDB data to Stash data
    const _toStash = {
        /**
         * StashDB scene to Stash
         * @async
         * @param {stashDBScene} data StashDB scene
         * @param {object} [options={}] Special action
         * @param {boolean} [options.create] Create missing data
         * @param {string|number} [options.update] Element to update with converted data
         * @param {boolean} [options.find] Return missing data
         * @returns {object} Stash scene if options.find is true return {scene,missing} instead
         */
        scene: async (data, options = {}) => {
            const studio = await _get.studio(data.studio, options.create);
            const performers = await _get.performers(data.performers, options.create);
            const tags = await _get.tags(data.tags, options.create);
            let scene = {};
            if (data.images) scene.cover_image = data.images[0].url;
            if (data.title) scene.title = data.title;
            if (data.code) scene.code = data.code;
            if (data.details) scene.details = data.details;
            if (data.director) scene.director = data.director;
            if (data.urls) scene.urls = _get.urls(data.urls);
            if (data.release_date) scene.date = scene.release_date;
            if (data.id) scene.stash_ids = _get.stashId(data.id);
            if (studio && !isNaN(studio.id)) scene.studio_id = studio.id;
            if (performers.find) scene.performer_ids = performers.find;
            if (tags.find) scene.tag_ids = tags.find;
            if (options.update !== undefined) {
                scene.id = options.update;
                const updated = await sk.stash.update.scene(scene);
            };
            let missing = {};
            if (options.find) {
                if (!studio || isNaN(studio.id)) missing.studio = data.studio;
                if (performers.missing) missing.performers = performers.missing;
                if (tags.missing) missing.tags = tags.missing;
                scene = {
                    scene: scene,
                    missing: missing
                };
            }
            return scene;
        },
        /**
         * StashDB performer to Stash
         * @async
         * @param {stashDBPerformer} data StashDB performer
         * @param {object} [options={}] Special action
         * @param {string|number} [options.update] Element id to update with converted data
         * @param {boolean} [options.images] If true return {performer, images} with all profile picture instead of performer{}
         * @returns {object} Stash performer
         */
        performer: async (data, options = {}) => {
            let performer = {};
            if (data.images) performer.image = data.images[0].url;
            if (data.name) performer.name = data.name;
            if (data.disambiguation) performer.disambiguation = data.disambiguation;
            if (data.urls) performer.urls = _get.urls(data.urls);
            if (data.gender) performer.gender = data.gender;
            if (data.birthdate) performer.birthdate = data.birth_date
            if (data.ethnicity) performer.ethnicity = data.ethnicity[0] + data.ethnicity.slice(1).toLowerCase();
            if (data.country) performer.country = data.country;
            if (data.eye_color) performer.eye_color = data.eye_color;
            if (data.height) performer.height_cm = data.height;
            if (data.band_size && data.cup_size && data.waist_size && data.hip_size) performer.measurements = `${data.band_size}${data.cup_size}-${data.waist_size}-${data.hip_size}`;
            if (data.breast_type) performer.fake_tits = data.breast_type[0] + data.breast_type.slice(1).toLowerCase();
            if (data.penis_length) performer.penis_length = data.penis_length;
            if (data.circumcised) performer.circumcised = data.circumcised;
            if (data.career_start_year) performer.career_length = !data.career_end_year ? `${data.career_start_year} -` : `${data.career_start_year} - ${data.career_end_year}`;
            if (data.tattoos) performer.tattoos = _get.tattosPiercings(data.tattoos);
            if (data.piercings) performer.piercings = _get.tattosPiercings(data.piercings);
            if (data.aliases) performer.alias_list = data.aliases;
            if (data.id) performer.stash_ids = _get.stashId(data.id);
            if (data.death_date) performer.death_date = data.death_date;
            if (data.hair_color) performer.hair_color = data.hair_color[0] + data.hair_color.slice(1).toLowerCase();
            if (data.weight) performer.weight = data.weight;
            if (options.update !== undefined) {
                performer.id = options.update;
                const updated = await sk.stash.update.performer(performer);
                debugger
            };
            if (options.images) performer = { performer: performer, images: _get.urls(data.images) };
            return performer;
        },
        /**
         * StashDB studio to Stash
         * @async
         * @param {stashDBStudio} data StashDB studio
         * @param {object} [options={}] Special action
         * @param {boolean} [options.create] Create missing data
         * @param {string|number} [options.update] Element to update with converted data
         * @param {boolean} [options.find] Return missing data
         * @returns {object} Stash studio if options.find is true return {studio,missing} instead
         */
        studio: async (data, options = {}) => {
            const parent = await _get.studio(data.parent, options.create);
            let studio = {};
            if (data.name) studio.name = data.name;
            if (data.aliases) studio.aliases = data.aliases;
            if (data.urls) studio.urls = _get.urls(data.urls);
            if (data.id) studio.stash_ids = _get.stashId(data.id);
            if (parent || !isNaN(parent.id)) studio.parent_id = parent.id;
            if (options.update !== undefined) {
                studio.id = options.update;
                const updated = await sk.stash.create.studio(studio);
            };
            if (options.find) {
                studio = { studio: studio, missing: data.parent };
            };
            return studio;
        },
        /**
         * StashDB tag to Stash
         * @async
         * @param {stashDBTags} data StashDB tag
         * @param {object} [options] Special action
         * @param {string|number} [options.update] Element to update with converted data
         * @returns {object} Stash tag
         */
        tag: async (data, options) => {
            let tag = {};
            if (data.name) tag.name = data.name;
            if (data.description) tag.description = data.description;
            if (data.aliases) tag.aliases = data.aliases;
            if (data.id) tag.stash_ids = _get.stashId(data.id);
            if (options.update !== undefined) {
                tag.id = options.update;
                const updated = sk.stash.update.tag(tag);
            };
            return tag;
        }
    };

    /**
     * Transform given data to Stash data
     * @async
     * @param {stashDBScene|stashDBPerformer|stashDBStudio|stashDBTags} stashdbData StashDB data
     * @param {object} [options] Special action
     * @param {boolean} [options.create] Create missing data
     * @param {string|number} [options.update] Element to update with converted data
     * @param {boolean} [options.find] Return missing data
     * @returns {object|object[]} Stash data
     */
    const toStash = async (stashdbData, options) => {
        let stashData = [];
        const category = stashdbData._category;
        if (!stashdbData[0]) stashdbData = [stashdbData];
        for (data of stashdbData) {
            const transform = await _toStash[category](data, options);
            stashData.push(transform);
        };
        return stashData[1] ? stashData : stashData[0];
    };

    return { canUse, find, toStash };
}();

//BOOKMARK skPlugin

/**
  * Create and return the Plugin module
  * @returns {object} skPlugin module
  */
sk.plugin = function skPlugin() {
    /**
     * Return the selected plugins
     * @param {string|array.<string>} names Plugin names
     * @returns {object|object[]} Plugins
     */
    const get = (names) => {
        const _plugins = sk.stash.configuration().plugins;
        if (!names) return _plugins;
        if (!Array.isArray(names)) return _plugins[names];
        let find = [];
        names.forEach((names) => { if (_plugins[name]) find.push(_plugins.name); });
        return find;
    };

    /**
     * Update the plugin
     * @param {object} plugin Plugin to update
     * @param {string} plugin.name Plugin name
     * @param {object} plugin.options Plugin options
     * @returns {promise} Update result
     */
    const _gql = async (plugin) => {
        const query = 'mutation configurePlugin($plugin_id: ID!, $input: Map!) {configurePlugin(plugin_id: $plugin_id, input: $input)}';
        try {
            const response = await fetch('/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ApiKey': sk.stash.configuration().general.ApiKey || ''
                },
                body: JSON.stringify({ query: query, variables: { plugin_id: plugin.name, input: plugin.options } })
            });
            const result = await response.json();
            return result.data.configurePlugin;
        } catch (e) {
            return e;
        }
    };

    /**
     * Update plugins with the given data
     * @async
     * @param {object[]} plugins Plugins object list
     * @param {string} plugins[].name Plugin name
     * @param {object} plugins[].options Plugin new data {name:value}
     * @param {boolean} notReplace If true does not replace existing value
     * @returns {promise|array.<promise>} Updated response
     */
    const update = async (plugins, notReplace) => {
        let results = [];
        if (!plugins[0]) plugins = [plugins];
        for (plugin of plugins) {
            var newData = {};
            var currentData = get(plugin.name) || {};
            for (option in currentData) { newData[option] = currentData[option]; };
            for (option in plugin.options) {
                if (!notReplace || notReplace && newData[option] === undefined) newData[option] = plugin.options[option];
            };
            const response = await _gql({ name: plugin.name, options: newData });
            response._name = plugin.name;
            results.push(response);
        };
        return results.length === 1 ? results[0] : results;
    };

    /**
     * Check and set default data without replacing already setted options
     * @async
     * @param {object[]} plugins Plugins object list
     * @param {string} plugins[].name Plugin name
     * @param {object} plugins[].options Plugin new data {name:value}
     * @returns{promise|array.<promise>} Updated response
     */
    const check = async (plugins) => { return update(plugins, true) };

    return { get, update, check };
}();