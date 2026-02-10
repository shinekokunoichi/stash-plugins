const sk = {};
//BOOKMARK skTool

/**
 * Create and return the Tool module
 * @returns {object} skTool module
 */
sk.tool = function skTool() {
    /**
     * Wait for a UI element then execute a function
     * @param {string} selector Query selector for the waiting element
     * @param {function} callback What execute when the element is displayed
     * @param {boolean} [stopWatching] If true remove the observer
    */
    const wait = (selector, callback, stopWatching) => {
        const observer = new MutationObserver((mutation, obs) => {
            const wait = get(selector);
            if (wait) {
                if (stopWatching) obs.disconnect();
                callback(callback);
            };
        });
        observer.observe(document, { childList: true, subtree: true });
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
     * Return an array of skUI objects {@see skUI} selected inside the document or the given HTML Element/skUI object
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

//BOOKMARK skHook

/**
 * Create and return the Hook module
 * @returns {object} skHook module
 */
sk.hook = function skHook() {
    /**
     * @typedef {object} skHookWatcher Hook watcher object
     * @property {string} category scene, marker, image, gallery, group, performer, studio, tag
     * @property {string} operation create, update, destroy, merge
     * @property {function} callback Function to execute on hook trigger
     */

    // Original fetch
    const _fetch = window.fetch.bind(window);

    // Custom fetch
    window.fetch = async (...args) => {
        let query;
        const url = args[0];
        if (args[1]) {
            args[1].signal = undefined;
            query = JSON.parse(args[1].body).query;
        };
        let watcher = false;
        if (url.includes('graphql')) watcher = find(query);
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

    const _category = ['scene', 'sceneMarker', 'image', 'gallery', 'group', 'performer', 'studio', 'tag'];
    const _operation = ['find', 'create', 'update', 'destroy', 'merge'];
    let _watch = {};

    //Populate watcher placeholders
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
     * Return watcher for given query
     * @param {string} query GQL query
     * @returns {skHookWatcher|boolean} False or watcher object
     */
    const find = (query) => {
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
     * @param {skHookWatcher[]} watcher Watcher objects
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

//BOOKMARK skTask

/**
 * Create and return the Task module
 * @returns {object} skTool module
 */
sk.task = function skTask() {
    let _tasksList = {};

    /**
     * @typedef {object} skTaskWatcher Task object
     * @property {string} id Task id - Your plugin name
     * @property {string} name Task name
     * @property {string} description Task description
     * @property {function} callback Function to execute on task run
     * @property {*} arg Arguments to pass to the callback function
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
    const set = () => {
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

    sk.tool.wait('#configuration-tabs-tabpane-tasks', set, true);
    return { add };
}();

//BOOKMARK skGraphicBase

/**
 * @typedef {object} skUI Custom UI element
 * @property {HTMLElement}element The original HTML element
 * @property {function} get Return the selected element inside skUI.element {@see sk.get}
 * @property {function} getAll Return the selected elements inside skUI.element {@see sk.getAll}
 * @property {function} id Return or change id
 * @property {function} class Return the classname, enable or disable class or replace it
 * @property {function} read Return HTML or Text
 * @property {function} write Write HTML or Text
 * @property {function} url Set or return src/href of the element
 * @property {function} child Return element children
 * @property {function} append Append children (skUI or HTML element)
 * @property {function} event Add events to the element
 * @property {function} style Return or change the element styles
 * @property {function} attribute Return or change the element attributes
 * @property {function} flex Set a preset to make the element a flex
 * @property {function} size Set width and height of the element
 * @property {function} remove Remove the element
 */

/**
 * @typedef {object} skUIOptions skUI options
 * @property {string} [id] Element id
 * @property {string|array} [class] String or array of classes. Ex for string 'a b c'
 * @property {string} [text] Element inner text
 * @property {string} [html] Element inner HTML
 * @property {string} [url] Element src/href
 * @property {HTMLElement|HTMLCollection[]|skUI|skUI[]} [append] Children to append
 * @property {object|object[]} [event] Events to add {type, callback}
 * @property {object} [style] Style to apply {css:value}
 * @property {object} [attribute] Attribute to apply {name:value}
 * @property {boolean} [flex] Set a preset to make the element a flex
 */


/**
 * Create and return a skUI object
 * @param {string} tag HTML element tag to create
 * @param {skUIOptions} [options] skUI options
 * @returns {skUI} The created skUI object
 */
function skGraphicBase(tag, options = {}) {
    const base = {};

    /** @const {HTMLElement} base.element The HTML element created */
    base.element = typeof tag === 'string' ? document.createElement(tag) : tag;

    /**
     * Remove the element
     */
    base.remove = () => { base.element.remove(); };

    /**
     * Return the selected elements inside skUI.element {@see sk.tool.getAll}
     * @param {string} selector Query selector
     * @returns {skUI[]} Selected elements
     */
    base.getAll = (selector) => { return sk.tool.getAll(selector, base.element); };

    /**
     * Return the selected element inside skUI.element {@see sk.tool.get}
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
        if (replace) base.element.className = classList.join(' ');
        if (typeof classList === 'string') classList = classList.split(' ');
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
    base.flex = () => { base.style({ 'display': 'flex', 'justify-content': 'center', 'aling-items': 'center' }); };

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

    for (init in options) {
        if (init !== 'text' && init !== 'html') base[init](options[init]);
        if (init === 'text') base.write(options[init]);
        if (init === 'html') base.write(options[init], true);
    };
    return base.element ? base : false;
};

//BOOKMARK skGraphic

/**
 * Create and return the UI module
 * @returns {object} skGraphic module
 */
sk.ui = function skGraphic() {
    // UI Selector
    const get = {
        //GENERAL

        /**
         * Return the navbar UI element
         * @returns {skUI} Navbar
         */
        navbar: () => {
            const navbar = sk.tool.get('nav');
            navbar.brand = sk.tool.get('.navbar-brand');
            navbar.nav = sk.tool.get('.navbar-nav');
            navbar.buttons = sk.tool.get('.navbar-buttons');

            /**
            * Create, append and return a new navbar button
            * @param {string} name Button name
            * @param {function} callback Function to execute when clicked
            * @param {string} [where=nav] Where append the button. brand/nav/buttons
            * @returns {skUI} Button element
            */
            navbar.add = (name, callback, where) => {
                const div = make.container({ class: 'col-4 col-sm-3 col-md-2 col-1 g-auto nav-link' });
                const a = make.link({ class: 'minimal p-4 p-xl-2 d-flex d-xl-inline-block flex-column justify-content-between align-items-center btn btn-primary' });
                a.event({ type: 'click', callback: callback });
                const text = make.span({ text: name });
                navbar[where].append(div)
                div.append(a);
                a.append(text)
                return div;
            };
            return navbar;
        },
        /**
         * Return the main content container UI
         * @returns {skUI} Main container
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
                get.navbar().nav.getAll('a').forEach((a) => { a.event({ type: 'click', callback: () => { const all = sk.tool.getAll('.skContainer'); all.forEach((c) => { c.style({ display: 'none' }); }); }}) });
                return custom;
            };
            /**
             * Return the current active Stash content container
             * @returns {skUI} Content container
             */
            container.active = () => { return sk.tool.get('.item-list-container') || sk.tool.get('.recommendations-container'); };
            return container;
        },
        //PERFORMERS

        /**
         * Return all performers cards
         * @returns {skUI[]} Performers cards
         */
        performersCard: () => {
            const cards = sk.tool.getAll('.performer-card');
            for (card of cards) {
                const data = {};
                const isFavorite = card.get('.favorite');
                const notFavorite = card.get('.not-favorite');
                data.topSection = card.get('.thumbnail-section');
                data.ratingBanner = card.get('.rating-banner');
                data.rating = data.ratingBanner.read(true);
                data.page = data.topSection.get('a').url();
                data.id = data.page.split('performers/')[1];
                data.image = data.topSection('img');
                card.middleSection = card.get('.card-section');
                card.name = card.get('.performer-name');
                card.disambiguation = card.get('.performer-disambiguation');
                card.gender = card.get('.gender-icon');
                card.popOver = card.get('.card-popovers');
                card.scenesCount = card.get('.scene-count span');
                card.imagesCount = card.get('.image-count span');
                card.galleriesCount = card.get('.gallery-count span');
                card.tagsCount = card.get('.tag-count span');
                data.favorite = isFavorite.element ? isFavorite : notFavorite;
                card._data = data;
            };
            return cards;
        },
        /**
         * Get details element of the performer page
         * @returns {skUI} Performer details
         */
        performerDetail: () => {
            const data = {};
            const isFavorite = sk.tool.get('.favorite');
            const notFavorite = sk.tool.get('.not-favorite');
            const ratingStar = sk.tool.get('.star-rating-number');
            const ratingDecimal = sk.tool.get('.rating-number span');
            data.container = sk.tool.get('.detail-container');
            data.headers = sk.tool.get('.detail-header-image');
            data.image = sk.tool.get('img.performer');
            data.name = sk.tool.get('.performer-name');
            data.disambiguation = sk.tool.get('.performer-disambiguation');
            data.details = sk.tool.get('.detail.group');
            data.customFields = sk.tool.get('.custom-fields');
            data.navbar = sk.tool.get('.nav.nav-tabs');
            data.tabContent = sk.tool.get('.tab-content');
            data.favorite = isFavorite.element ? isFavorite : notFavorite;
            data.rating = ratingStar.element ? ratingStar : ratingDecimal;
            /**
             * Get a details
             * @param {string} name Detail name
             * @returns {skUI} Detail element
             */
            data.getDetails = (name) => {
                name = name.toLowerCase();
                return sk.tool.get(`.detail-item.${name}`);
            };
            return data;
        },
        //TAGS

        /**
         * Return tags popups element
         * @returns {skUI} Tags popups
         */
        tagsPopUps: () => { return sk.tool.getAll('.tag-item')}
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

    return { get, make };
}();

//BOOKMARK skStash

/**
  * Create and return the Stash module
  * @returns {object} skStash module
  */
sk.stash = function skStash() {
    /** @const {object} configuration Stash configuration */
    const configuration = window.__APOLLO_CLIENT__.cache.data.data.ROOT_QUERY.configuration;
    const _server = `${window.location.protocol}//${window.location.host}`;
    const _defaulHeaders = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ApiKey: configuration.general.ApiKey || ''
        }
    };
    const _query = {
        find: 'query {find@uppercase@(@filters@){@category@{@fields@}}}',
        update: 'mutation @singular@Update($input:@sUppercase@UpdateInput!){@singular@Update(input:$input){id}}',
        bulkUpdate: 'mutation bulk@uppercase@Update($input:Bulk@uppercase@UpdateInput!){bulk@uppercase@Update(input:$input){ids}}',
        create: 'mutation @singular@Create($input:@sUppercase@CreateInput!){@singular@Create(input:$input){id}}'
    };
    const _fields = {
        scenes: 'id title code details director urls date rating100 organized o_counter interactive interactive_speed captions {@caption@} created_at updated_at last_played_at resume_time play_duration play_count play_history o_history files {@videoFile@} paths {@videoPath@} scene_markers {@sceneMarkers@} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@} stash_ids {@stashID@} sceneStreams {@sceneStream@}',
        images: 'id title code rating100 urls date details photographer o_counter organized created_at updated_at paths {@imagePath@} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@}',
        groups: 'id name aliases duration date rating100 studio {@studios@} director synopsis urls tags {@tags@} created_at updated_at containing_groups { group {@groups@} description } sub_groups { group {@groups@} description } front_image_path back_image_path scene_count performer_count sub_group_count scenes {@scenes@} o_counter',
        sceneMarkers: 'id scene {@scenes@} title seconds end_seconds primary_tag {@tags@} tags {@tags@} created_at updated_at stream preview screenshot',
        galleries: 'id title code urls date details photographer rating100 organized created_at updated_at files {@baseFile@} folder {@folder@} chapters {@chapter@} scenes {@scenes@} studio {@studios@} image_count tags {@tags@} performers {@performers@} cover {@imageFile@} paths {@galleryPath@}',
        performers: 'id name disambiguation urls gender birthdate ethnicity country eye_color height_cm measurements fake_tits penis_length circumcised career_length tattoos piercings alias_list favorite tags {@tags@} ignore_auto_tag image_path scene_count image_count gallery_count group_count performer_count o_counter scenes {@scenes@} stash_ids {@stashID@} rating100 details death_date hair_color weight created_at updated_at groups {@groups@} custom_fields',
        studios: 'id name urls parent_studio {@studios@} child_studios {@studios@} aliases tags {@tags@} ignore_auto_tag image_path scene_count image_count gallery_count group_count stash_ids {@stashID@} rating100 favorite details created_at updated_at groups {@groups@} o_counter',
        tags: 'id name sort_name description aliases ignore_auto_tag created_at updated_at favorite stash_ids {@stashID@} image_path scene_count scene_marker_count image_count gallery_count performer_count studio_count group_count parent_count child_count parents {@tags@} children {@tags@}',
        folder: 'id path parent_folder {@folder@} mod_time created_at updated_at',
        baseFile: 'id path basename mod_time size created_at updated_at',
        videoFile: 'id path basename mod_time size format width height duration video_codec audio_codec frame_rate bit_rate created_at updated_at',
        imageFile: 'id title code rating100 urls date details photographer o_counter organized created_at updated_at paths {@imagePath@} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@}',
        caption: 'language_code caption_type',
        videoPath: 'screenshot preview stream webp vtt sprite funscript interactive_heatmap caption',
        imagePath: 'thumbnail preview image',
        galleryPath: 'cover preview',
        sceneStream: 'url mime_type label',
        chapter: 'id  gallery {@galleries@} title image_index created_at updated_at',
        stashID: 'endpoint stash_id updated_at',
        _id: 'id',
        _caption: 'language_code',
        _videoPath: 'preview',
        _imagePath: 'preview',
        _galleryPath: 'preview',
        _sceneStream: 'url',
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
     * @property {string} [fields] Fields to retrieve, default all. Ex. 'id title'
     * @property {object} [filter] Request filter
     * @property {string} [filter.q] Search
     * @property {number} [filter.per_page] Max result
     * @property {object} [fieldFilter] Specific category filter
     * @property {array.<number>} [ids] IDs to get
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

        let fields = configuration.fields;
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
        return result;
    };
    // Find query
    const find = {
        /**
         * Find scenes
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Find images
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Find groups
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Find scene markers
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Find galleries
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Find performers
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Find studios
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Find tags
         * @async
         * @param {string|skStashFilters} [configuration] Search or Request filters
         * @returns {object} Response data
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
         * @returns {object} Response data
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
         * Update scenes
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        scenes: async (input) => {
            const response = await _do('bulkUpdate', 'scenes', undefined, input);
            return response;
        },
        /**
         * Update scene
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        scene: async (input) => {
            const response = await _do('update', 'scenes', undefined, input);
            return response;
        },
        /**
         * Update images
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        images: async (input) => {
            const response = await _do('bulkUpdate', 'images', undefined, input);
            return response;
        },
        /**
         * Update image
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        image: async (input) => {
            const response = await _do('update', 'images', undefined, input);
            return response;
        },
        /**
         * Update groups
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        groups: async (input) => {
            const response = await _do('bulkUpdate', 'groups', undefined, input);
            return response;
        },
        /**
         * Update group
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        group: async (input) => {
            const response = await _do('update', 'groups', undefined, input);
            return response;
        },
        /**
         * Update scene markers
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        markers: async (input) => {
            const response = await _do('bulkUpdate', 'sceneMarkers', undefined, input);
            return response;
        },
        /**
         * Update scene marker
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        marker: async (input) => {
            const response = await _do('update', 'sceneMarkers', undefined, input);
            return response;
        },
        /**
         * Update galleries
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        galleries: async (input) => {
            const response = await _do('bulkUpdate', 'galleries', undefined, input);
            return response;
        },
        /**
         * Update gallery
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        gallery: async (input) => {
            const response = await _do('update', 'galleries', undefined, input);
            return response;
        },
        /**
         * Update performers
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        performers: async (input) => {
            const response = await _do('bulkUpdate', 'performers', undefined, input);
            return response;
        },
        /**
         * Update performer
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        performer: async (input) => {
            const response = await _do('update', 'performers', undefined, input);
            return response;
        },
        /**
         * Update studios
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        studios: async (input) => {
            const response = await _do('bulkUpdate', 'studios', undefined, input);
            return response;
        },
        /**
         * Update studio
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        studio: async (input) => {
            const response = await _do('update', 'studios', undefined, input);
            return response;
        },
        /**
         * Update tags
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        tags: async (input) => {
            const response = await _do('bulkUpdate', 'tags', undefined, input);
            return response;
        },
        /**
         * Update tag
         * @async
         * @param {object} input New data
         * @returns {object} Response data
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
         * @param {object} input New data
         * @returns {object} Response data
         */
        scene: async (input) => {
            const response = await _do('create', 'scenes', undefined, input);
            return response;
        },
        /**
         * Update image
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        image: async (input) => {
            const response = await _do('create', 'images', undefined, input);
            return response;
        },
        /**
         * Update group
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        group: async (input) => {
            const response = await _do('create', 'groups', undefined, input);
            return response;
        },
        /**
         * Update scene marker
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        marker: async (input) => {
            const response = await _do('create', 'sceneMarkers', undefined, input);
            return response;
        },
        /**
         * Update gallery
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        gallery: async (input) => {
            const response = await _do('create', 'galleries', undefined, input);
            return response;
        },
        /**
         * Update performer
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        performer: async (input) => {
            const response = await _do('create', 'performers', undefined, input);
            return response;
        },
        /**
         * Update studio
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        studio: async (input) => {
            const response = await _do('create', 'studios', undefined, input);
            return response;
        },
        /**
         * Update tag
         * @async
         * @param {object} input New data
         * @returns {object} Response data
         */
        tag: async (input) => {
            const response = await _do('create', 'tag', undefined, input);
            return response;
        }
    };

    /**
     * Return stashBox with the given name
     * @param {string} name StashBox name
     * @returns {object} StashBox
     */
    const getStashBox = (name) => {
        let find = false;
        const stashBoxes = configuration.general.stashBoxes;
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
     * @property {string} term Search
     * @property {number} [limit] Max result
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
     * @property {string} [id] Scene StashDB id
     * @property {string} [title] Scene title
     * @property {object[]} [images] Scene images
     * @property {string|number} [code] Scene code
     * @property {string} [details] Scene details
     * @property {string} [director] Scene director
     * @property {object[]} [urls] Scene urls data
     * @property {string} [release_date] Scene release date (yyyy-mm-dd)
     * @property {object} [studio] Scene studio
     * @property {object[]} [performers] Scene performers
     * @property {object[]} [tags] Scene tags
     */

    /**
     * @typedef {object} stashDBPerformer StashDB performer data
     * @property {string} [id] StashDB performer id
     * @property {string} [name] Performer name
     * @property {string} [disambiguation] Performer disambiguation
     * @property {object[]} [urls] Performer urls data
     * @property {string} [gender] Performer gender
     * @property {string} [birth_date] Performer birth date (yyyy-mm-dd)
     * @property {string} [ethnicity] Performer ethnicity
     * @property {string} [country] Performer country code
     * @property {string} [eye_color] Performer eyes color
     * @property {number} [height] Performer height in cm
     * @property {number} [band_size] Performer band size
     * @property {string} [cup_size] Performer cup size
     * @property {number} [waist_size] Performer waist size
     * @property {number} [hip_size] Performer hip size
     * @property {string} [breast_type] Performer breast type natural|augmented
     * @property {number} [penis_length] Performer penis length in cm
     * @property {string} [circumcised] Performer circumcised cut|uncut
     * @property {string} [career_start_year] Performer career starting year
     * @property {string} [career_end_year] Performer career ending year
     * @property {object[]} [tattoos] Performer tattoos list
     * @property {object[]} [piercings] Performer piercings list
     * @property {array.<string>} [aliases] Performer aliases list
     * @property {string} [death_date] Performer death date (yyyy-mm-dd)
     * @property {string} [hair_color] Performer hair color
     * @property {number} [weight] Performer weight in kg
     */

    /**
     * @typedef {object} stashDBStudio StashDB studio data
     * @property {string} [id] StashDB studio id
     * @property {string} [name] Studio name
     * @property {array.<string>} [aliases] Studio aliases list
     * @property {object[]} [url] Studio urls data
     * @property {object} [parent] Studio parent object
     */

    /**
     * @typedef {object} stashDBTags StashDB tag data
     * @property {string} [id] StashDB tag id
     * @property {string} [name] Tag name
     * @property {string} [description] Tag description
     * @property {array.<string>} [aliases] Tag aliases list
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
                if(description || location && !value) value = description || location;
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
    const _plugins = sk.stash.configuration.plugins;

    /**
     * Return the selected plugins
     * @param {string|array.<string>} names Plugin names
     * @returns {object|object[]} Plugins
     */
    const get = (names) => {
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
                    'ApiKey': sk.stash.configuration.general.ApiKey || ''
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
            var currentData = _plugins[plugin.name] || {};
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