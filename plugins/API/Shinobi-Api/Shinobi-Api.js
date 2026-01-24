//BOOKMARK skBase
/**
 * @file Custom StashApp API.
 * @copyright ShinekoKunoichi
 * @license CC-BY-NC-ND-4.0
 */

/**
 * The main constructor for the API
 * @constructor
*/
function ShinobiApi() {
    this.initialize.call(this);
};

/**
 * Check if the API is already initializated
 * @returns {boolean}
 */
ShinobiApi.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Initialize the API
 * @returns If is already initialized
 * @async
 */
ShinobiApi.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this.ui = await new skGraphic();
    this.stash = await new skStash();
    this.plugins = await new skPlugins();
    this.stashDB = await new skStashDB();
    this.hook = await new skHook();
    this.task = await new skTask();
    this.scraper = await new skScraper();
    this._initializated = true;
};

/**
 * Check if the selected element appear on page
 * @param {string} selector Query selector
 * @param {function} callback Function to run with selected element as parameter
 * @param {boolean} keepWatching If true remove the observer
 */
ShinobiApi.prototype.observe = function (selector, callback, stopWatching) {
    const observer = new MutationObserver((mutation, obs) => {
        const wait = document.querySelector(selector);
        if (wait) {
            if (stopWatching) obs.disconnect();
            callback(wait);
        };
    });
    observer.observe(document, { childList: true, subtree: true });
};

/**
 * Set up a new observer
 * @param {string} selector Query selector
 * @param {function} callback Function to run with selected element as parameter
 * @param {boolean} stopWatching If true remove the observer
 */
ShinobiApi.prototype.wait = function (selector, callback, stopWatching) {
    PluginApi.Event.addEventListener('stash:location', this.observe(selector, callback, stopWatching));
};


/**
 * Set current notification permission
 */
ShinobiApi.prototype.setNotification = function () {
    this._notificationPermission = Notification.permission;
};

/**
 * Return current notification permission
 * @returns {boolean}
 */
ShinobiApi.prototype.getNotification = function () {
    return this._notificationPermission;
}

/**
 * Ask for notification permission
 */
ShinobiApi.prototype.notificationPermission = async function () {
    Notification.requestPermission().then((result) => { return result });
};

/**
 * Enable notification for stash
 * @returns If is already granted
 */
ShinobiApi.prototype.useNotification = async function (name) {
    if (this.getNotification() === 'granted') return;
    const permission = await this.notificationPermission();
    this.setNotification();
};

/**
 * Make a notification
 * @param {strng} message
 */
ShinobiApi.prototype.notify = function (title, message) {
    if (this.getNotification !== 'granted') {
        console.log(message);
        return;
    };
    const logo = document.querySelector("link[rel='shortcut icon']").href;
    const notify = new Notification(title, { body: message, icon: logo });
};

//BOOKMARK skGraphicBase
/**
 * Base constructor for graphic elements
 * @constructor
 */
function skGraphicBase() { };

/**
 * Set and create the graphic element
 * @param {string|HTMLElement} element HTML Tag or HTML element
 */
skGraphicBase.prototype.set = function (element) {
    this._container = typeof element === 'string' ? document.createElement(element) : element;
};

/**
 * Get the graphic element
 * @returns {HTMLElement}
 */
skGraphicBase.prototype.get = function () {
    return this._container;
};

/**
 * Delete the element
 */
skGraphicBase.prototype.remove = function () {
    this.get().remove();
};

/**
 * Get or set style
 * @param {string|object} option Style name or object with multiple value
 * @param {string|number} value Value to set
 * @param {boolean} important If need to set priority
 * @returns {string} If the value is not defined return the option
 */
skGraphicBase.prototype.css = function (option, value, important) {
    if (!important) important = '';
    if (option && value === undefined) return this.get().style.getPropertyValue(option);
    if (option && value !== undefined) this.get().style.setProperty(option, value, important);
    if (typeof option !== 'string' && value === undefined) for (opt in option) { this.get().style[opt] = option[opt]; };
};

/**
 * Get or set attribute
 * @param {string|object} option Attribute name or object with multiple value
 * @param {string|number} value Value to set
 * @returns {string} If the value is not defined return the option
 */
skGraphicBase.prototype.attribute = function (option, value) {
    if (option && value === undefined) return this.get().getAttribute(option);
    if (option && value !== undefined) this.get().setAttribute(option, value);
    if (typeof option !== 'string' && value === undefined) for (opt in option) { this.get().setAttribute(opt, option[opt]); };
};

/**
 * Get or set id
 * @param {string} id Id value
 * @returns {string} If the id is not defined return the current id
 */
skGraphicBase.prototype.id = function (id) {
    if (id === undefined) return this.get().id;
    this.get().id = id;
};

/**
 * Get or toggle class
 * @param {string} value Class name
 * @param {boolean} replace If replace all the class instead of toggle them
 * @returns {string} If the value is not defined return the className
 */
skGraphicBase.prototype.class = function (value, replace) {
    if (!replace && !value) return this.get().className;
    if (!replace && value && !value.includes(' ')) this.get().classList.toggle(value);
    if (!replace && value && value.includes(' ')) value.split(' ').forEach((cls) => { this.get().classList.toggle(cls) });
    if (replace && value) this.get().className = value;
};

/**
 * Get or append child
 * @param {HTMLElement} child Child to append
 * @returns {ChildNode|object} ChildNode or skGraphicBase object. If the child is not defined return the childList
 */
skGraphicBase.prototype.child = function (child) {
    if (!child) return this.get().childList;
    if (child.constructor === skGraphicBase) child = child.get();
    this.get().appendChild(child);
};

/**
 * Set a event
 * @param {string} type Event Type
 * @param {function} callback Function to run on event trigger
 */
skGraphicBase.prototype.event = function (type, callback) {
    this.get().addEventListener(type, callback);
};

/**
 * Get or set text
 * @param {string} text Text to insert
 * @returns {string} If the text is not defined return current text
 */
skGraphicBase.prototype.text = function (text) {
    if (text === undefined) return this.get().innerText;
    this.get().innerText = text;
};

/**
 * Get or set inner html
 * @param {string} text HTML string to insert
 * @returns {string} If the text is not defined return current innerHTML
 */
skGraphicBase.prototype.html = function (text) {
    if (text === undefined) return this.get().innerHTML;
    this.get().innerHTML = text;
};

/**
 * Set a url automatically detecting if src or href
 * @param {string} url Url to set
 */
skGraphicBase.prototype.url = function (url) {
    const tag = this.get().tagName.toLowerCase();
    if (tag === 'a') this.get().href = url;
    if (tag === 'img' || tag === 'video') this.get().src = url;
};

/**
 * Set default value to make a flex
 */
skGraphicBase.prototype.flex = function () {
    this.css('display', 'flex');
    this.css('justifyContent', 'center');
    this.css('align-items', 'center');
};

/**
 * Get the size of the element based on default value or given one
 * @param {string|number} size full|big|half|small & any
 * @returns {string|number} Translated size or given
 */
skGraphicBase.prototype.autoSize = function (size) {
    if (size === 'full') return '100%';
    if (size === 'big') return '75%';
    if (size === 'half') return '50%';
    if (size === 'small') return '25%';
    return size;
};

/**
 * Get the margin of the element based on default value or given one
 * @param {string|number} size full|big|half|small & any
 * @returns {string|number} Translated margin or given
 */
skGraphicBase.prototype.autoMargin = function (size) {
    if (size === '100%') return '0%'
    if (size === '75%') return '12.5%';
    if (size === '50%') return '25%';
    if (size === '25%') return '37.5%';
    return size;
};

/**
 * Set the element to the center
 */
skGraphicBase.prototype.center = function () {
    const top = this.autoMargin(this.css('height'));
    const left = this.autoMargin(this.css('width'));
    this.css('margin', `${top} ${left}`);
};

/**
 * Set the element to the top
 */
skGraphicBase.prototype.top = function () {
    this.css('top', 0);
    this.css('margin-top', 0);
};

/**
 * Set the element to the bottom
 */
skGraphicBase.prototype.bottom = function () {
    this.css('bottom', 0);
    this.css('margin-bottom', 0);
};

/**
 * Set the element to the left
 */
skGraphicBase.prototype.left = function () {
    this.css('left', 0);
    this.css('margin-left', 0);
};

/**
 * Set the element to the right
 */
skGraphicBase.prototype.right = function () {
    this.css('right', 0);
    this.css('margin-right', 0);
};

/**
 * Set the default position
 * @param {string} position Where set the element. Ex: 'center'|'top left'
 */
skGraphicBase.prototype.defaultPosition = function (position) {
    if (position.includes('center')) this.center();
    if (position.includes('top')) this.top();
    if (position.includes('bottom')) this.bottom();
    if (position.includes('left')) this.left();
    if (position.includes('right')) this.right();
};

/**
 * Set width and height
 * @param {string} width full|big|half|small & any
 * @param {string} height full|big|half|small & any
 */
skGraphicBase.prototype.size = function (width, height) {
    this.css('width', this.autoSize(width));
    this.css('height', this.autoSize(height));
};

/**
 * Initialize the graphic element
 * @param {string} width full|big|half|small & any
 * @param {string} height full|big|half|small & any
 * @param {string} position Ex: 'center'|'top left'
 */
skGraphicBase.prototype.default = function (width, height, position) {
    if (width && height) this.size(width, height);
    if (position) this.defaultPosition(position);
};

//BOOKMARK skGraphic
/**
 * The Graphic module
 * @constructor
 */
function skGraphic() {
    this.initialize.call(this);
};

/**
 * Check if the module skGraphic is already initializated
 * @returns {boolean}
 */
skGraphic.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Initialize the module
 * @returns If is already initialized
 * @async
 */
skGraphic.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this._initializated = true;
};

/**
 * Get element in the dom
 * @param {string} selector
 * @returns {object} skGraphiBase element
 */
skGraphic.prototype.get = function (selector) {
    const element = document.querySelector(selector);
    return new this.transform(element);
};

/**
 * Get elements in the dom
 * @param {string} selector
 * @returns {array.<object>} skGraphiBase elements
 */
skGraphic.prototype.getAll = function (selector) {
    const elements = document.querySelectorAll(selector);
    return this.transform(elements);
};

/**
 * Transform a HTML element/s in skGraphicBase element/s
 * @param {HTMLElement|array.<HTMLElement>} elements
 * @returns {object|array.<object>} skGraphiBase element/s
 */
skGraphic.prototype.transform = function (elements) {
    if (!elements[0]) {
        let tempConstructor = {};
        tempConstructor.__proto__ = new skGraphicBase();
        tempConstructor.set(elements);
        return tempConstructor;
    } else {
        let list = [];
        elements.forEach((element) => {
            list.push(this.transform(element));
        });
        return list;
    };
};

skGraphic.prototype.make = {
    //PRESET
    popUp: function (width, height, position) {
        const popUp = new skGraphicBase()
        popUp.set('div');
        popUp.default(width, height, position);
        popUp.css('position', 'fixed');
        popUp.css('z-index', 9999);
        popUp.css('text-align', 'center');
        return popUp;
    },
    //CONTAINER
    container: function (width, height, position) {
        const container = new skGraphicBase();
        container.set('div');
        container.default(width, height, position);
        return container;
    },
    //DIVIDER
    divider: function () {
        const divider = new skGraphicBase();
        divider.set('hr');
        return divider;
    },
    //TEXT
    title: function (text) {
        const title = new skGraphicBase();
        title.set('h1');
        if (text) title.text(text);
        return title;
    },
    subTitle: function (text) {
        const subTitle = new skGraphicBase();
        subTitle.set('h3');
        if (text) subTitle.text(text);
        return subTitle;
    },
    description: function (text) {
        const description = new skGraphicBase();
        description.set('p');
        if (text) description.text(text);
        return description;
    },
    //MEDIA
    link: function (url) {
        const link = new skGraphicBase();
        link.set('a');
        if (url) link.url(url);
        return link;
    },
    video: function (url) {
        const video = new skGraphicBase();
        video.set('video');
        if (url) video.url(url);
        return video;
    },
    svg: function (fill, d) {
        const svg = new skGraphicBase();
        svg.set('svg');
        const path = new skGraphicBase();
        path.set('path');
        path.attribute({ fill: fill, d: d });
        svg.child(path);
        return svg;
    },
    //INPUT
    button: function (value) {
        const button = new skGraphicBase();
        button.set('button');
        button.attribute('type', 'button');
        if (value) button.attribute('value', value);
        return button;
    }
};

//BOOKMARK skStash
/**
 * The Stash module
 * @constructor
 * @private
 */
function skStash() {
    this.initialize.call(this);
};

/**
 * Check if the module skStash is already initializated
 * @returns {boolean}
 */
skStash.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Set Stash configuration
 */
skStash.prototype.setConfiguration = function () {
    this._configuration = window.__APOLLO_CLIENT__.cache.data.data.ROOT_QUERY.configuration;
};

/**
 * Get Stash configuration
 * @returns {object} Stash configuration
 */
skStash.prototype.getConfiguration = function () {
    return this._configuration;
};

/**
 * Get Stash protocol
 * @returns {string} Protocol
 */
skStash.prototype.getProtocol = function () {
    return window.location.protocol;
};

/**
 * Get Stash host
 * @returns {string} Host
 */
skStash.prototype.getHost = function () {
    return window.location.host;
};

/**
 * Set Stash server url
 */
skStash.prototype.setServer = function () {
    this._server = `${this.getProtocol()}//${this.getHost()}`;
};

/**
 * Get Stash server url
 * @returns {string} Stash url
 */
skStash.prototype.getServer = function () {
    return this._server;
};

/**
 * Set GraphQL url
 */
skStash.prototype.setGQL = function () {
    this._gql = this.getServer() + '/graphql';
};

/**
 * Get GraphQL url
 * @returns {string} GraphQL url
 */
skStash.prototype.getGQL = function () {
    return this._gql;
};

/**
 * Set Stash api key
 */
skStash.prototype.setApiKey = function () {
    this._apiKey = this.getConfiguration().general.apiKey;
};

/**
 * Get Stash api key
 * @returns {string} Api key
 */
skStash.prototype.getApiKey = function () {
    return this._apiKey;
};

/**
 * set base GraphQL headers
 */
skStash.prototype.setHeaders = function () {
    this._headers = this.getHeaders();
};

/**
 * Get the default headers for GraphQL
 * @returns {object} Headers data
 */
skStash.prototype.getHeaders = function () {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ApiKey': this.getApiKey()
        },
        variables: {}
    };
};

/**
 * Set field placeholder
 */
skStash.prototype.setField = function () {
    this._field = {
        default: {
            scenes: 'id title code details director urls date rating100 organized o_counter interactive interactive_speed captions {@caption@} created_at updated_at last_played_at resume_time play_duration play_count play_history o_history files {@videoFile@} paths {@videoPath@} scene_markers {@markers@} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@} stash_ids {@stashID@} sceneStreams {@sceneStream@}',
            images: 'id title code rating100 urls date details photographer o_counter organized created_at updated_at paths {@imagePath@} galleries {@galleries@} studio {@studios@} tags {@tags@} performers {@performers@}',
            groups: 'id name aliases duration date rating100 studio {@studios@} director synopsis urls tags {@tags@} created_at updated_at containing_groups { group {@groups@} description } sub_groups { group {@groups@} description } front_image_path back_image_path scene_count performer_count sub_group_count scenes {@scenes@} o_counter',
            markers: 'id scene {@scenes@} title seconds end_seconds primary_tag {@tags@} tags {@tags@} created_at updated_at stream preview screenshot',
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
        },
        update: {
            scenes: 'id title code details director urls date rating100 o_counter organized studio_id gallery_ids performer_ids groups movies tag_ids cover_image stash_ids resume_time play_duration play_count primary_file_id',
            images: 'id title code rating100 organized urls date details photographer studio_id performer_ids tag_ids gallery_ids primary_file_id',
            groups: 'id name aliases duration date rating100 studio_id director synopsis urls tag_ids containing_groups { group_id description } sub_groups { group_id description } front_image back_image',
            markers: 'id title seconds end_seconds scene_id primary_tag_id tag_ids',
            galleries: 'id title code urls date details photographer rating100 organized scene_ids studio_id tag_ids performer_ids primary_file_id',
            performers: 'id name disambiguation urls gender birthdate ethnicity country eye_color height_cm measurements fake_tits penis_length circumcised career_length tattoos piercings alias_list favorite tag_ids image stash_ids {endpoint stash_id updated_at} rating100 details death_date hair_color weight ignore_auto_tag',
            studios: 'id name urls parent_id image stash_ids rating100 favorite details aliases tag_ids ignore_auto_tag',
            tags: 'id name sort_name description aliases ignore_auto_tag favorite image stash_ids parent_ids child_ids'
        },
        bulkUpdate: {
            scenes: 'ids title code details director urls date rating100 o_counter organized studio_id gallery_ids performer_ids groups movies tag_ids cover_image stash_ids resume_time play_duration play_count primary_file_id',
            images: 'ids title code rating100 organized urls date details photographer studio_id performer_ids tag_ids gallery_ids primary_file_id',
            groups: 'ids name aliases duration date rating100 studio_id director synopsis urls tag_ids containing_groups { group_id description } sub_groups { group_id description } front_image back_image',
            markers: 'ids title seconds end_seconds scene_id primary_tag_id tag_ids',
            galleries: 'ids title code urls date details photographer rating100 organized scene_ids studio_id tag_ids performer_ids primary_file_id',
            performers: 'ids name disambiguation urls gender birthdate ethnicity country eye_color height_cm measurements fake_tits penis_length circumcised career_length tattoos piercings alias_list favorite tag_ids image stash_ids {endpoint stash_id updated_at} rating100 details death_date hair_color weight ignore_auto_tag',
            studios: 'ids name urls parent_id image stash_ids rating100 favorite details aliases tag_ids ignore_auto_tag',
            tags: 'ids name sort_name description aliases ignore_auto_tag favorite image stash_ids parent_ids child_ids'
        }
    };
};

/**
 * Get given field placeholder
 * @param {string} type
 * @param {string} field
 * @returns {string} Field placeholder
 */
skStash.prototype.getField = function (type, field) {
    return this._field[type][field];
};

/**
 * Initialize skStash module
 * @returns If is already initialized
 * @async
 */
skStash.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this._cache = {};
    this.setConfiguration();
    this.setServer();
    this.setGQL();
    this.setApiKey();
    this.setHeaders();
    this.setField();
    this._initializated = true;
};

/**
 * Get all stash boxes
 * @returns {array.<object>} Stash boxes
 */
skStash.prototype.getStashBoxes = function () {
    return this.getConfiguration().general.stashBoxes;
};

/**
 * Find the given stash box
 * @param {string} name Stash box name
 * @returns {object} Stash box data
 */
skStash.prototype.findStashBox = function (name) {
    const stashBoxes = this.getStashBoxes();
    let find = false;
    stashBoxes.forEach((stashBox) => {
        if (stashBox.name.toLowerCase() === name.toLowerCase()) find = stashBox;
    });
    return find;
};

/**
 * Get cached data
 * @param {string} [category] scenes|images|groups|markers|galleries|performers|studios|tags
 * @returns {object|array} Cached data
 */
skStash.prototype.getCache = function (category) {
    if (!category) return this._cache;
    return this._cache[category];
};

/**
 * Set new cached data for given category
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} data Category data
 */
skStash.prototype.setCache = function (category, data) {
    this._cache[category] = data;
};

/**
 * Return finded cached data
 * @param {string} categoryscenes scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} filter Filter object
 * @returns {array.<object>} Result data
 */
skStash.prototype.findCache = function (category, filter) {
    const data = this.getCache(category);
    const max = filter.per_page;
    const search = filter.q;
    if (max === 1 && search === '') return data[0];
    if (max === -1 && search === '') return data;
    let result = [];
    data.forEach((item) => {
        let match = false;
        const name = item.name || item.title;
        const aliases = item.aliases || item.alias_list;
        if (name.includes(search)) match = item;
        if (!name.includes(search)) aliases.forEach((alias) => {
            if (alias.includes(search)) match = item;
        });
        if (match) result.push(item);
    });
    if (result.length > max) result = result.splice(0, max);
    return result;
};

/**
 * Update cached data with the new scraped content
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} input scene|image|group|marker|gallery|performer|studio|tag
 * @param {number} input.id Object id
 * @returns {boolean} If the category is empty
 */
skStash.prototype.updateCache = function (category, input) {
    if (!this.getCache(category)) return;
    this.getCache(category).forEach((value, i) => { if (input.id === value.id) this[category][i] = input });
};

/**
 * Send a request to GraphQL interface
 * @param {string} query Complete query
 * @param {object} input Stash input object
 * @returns {object} Result data
 * @async
 */
skStash.prototype.GQL = async function (query, input) {
    if (!query) throw Error('Query must be defined', query);
    let configuration = this.getHeaders();
    configuration.body = JSON.stringify({ query: query, variables: { input: input } });
    const response = await sk.hook._fetch(this.getGQL(), configuration);
    let result = await response.json();
    result._type = 'stash';
    return result.data;
};

/**
 * Replace all field placeholder and return the finished field
 * @param {string} field Field placeholder
 * @returns {string} Complete field
 */
skStash.prototype.removeField = function (field) {
    if (field.includes('@scenes@')) field = field.replaceAll('@scenes@', this.getField('default', '_id'));
    if (field.includes('@images@')) field = field.replaceAll('@images@', this.getField('default', '_id'));
    if (field.includes('@groups@')) field = field.replaceAll('@groups@', this.getField('default', '_id'));
    if (field.includes('@markers@')) field = field.replaceAll('@markers@', this.getField('default', '_id'));
    if (field.includes('@galleries@')) field = field.replaceAll('@galleries@', this.getField('default', '_id'));
    if (field.includes('@performers@')) field = field.replaceAll('@performers@', this.getField('default', '_id'));
    if (field.includes('@studios@')) field = field.replaceAll('@studios@', this.getField('default', '_id'));
    if (field.includes('@tags@')) field = field.replaceAll('@tags@', this.getField('default', '_id'));
    if (field.includes('@folder@')) field = field.replaceAll('@folder@', this.getField('default', '_id'));
    if (field.includes('@baseFile@')) field = field.replaceAll('@baseFile@', this.getField('default', '_id'));
    if (field.includes('@videoFile@')) field = field.replaceAll('@videoFile@', this.getField('default', '_id'));
    if (field.includes('@imageFile@')) field = field.replaceAll('@imageFile@', this.getField('default', '_id'));
    if (field.includes('@caption@')) field = field.replaceAll('@caption@', this.getField('default', '_caption'));
    if (field.includes('@videoPath@')) field = field.replaceAll('@videoPath@', this.getField('default', '_videoPath'));
    if (field.includes('@imagePath@')) field = field.replaceAll('@imagePath@', this.getField('default', '_imagePath'));
    if (field.includes('@galleryPath@')) field = field.replaceAll('@galleryPath@', this.getField('default', '_galleryPath'));
    if (field.includes('@sceneStream@')) field = field.replaceAll('@sceneStream@', this.getField('default', '_sceneStream'));
    if (field.includes('@chapter@')) field = field.replaceAll('@chapter@', this.getField('default', '_id'));
    if (field.includes('@stashID@')) field = field.replaceAll('@stashID@', this.getField('default', 'stashID'));
    return field;
};

/**
 * Replace all field placeholder and return the complete field
 * @param {string} field Field placeholder
 * @returns {string} Complete field
 */
skStash.prototype.formatField = function (field) {
    if (field.includes('@scenes@')) field = field.replaceAll('@scenes@', this.getField('default', 'scenes'));
    if (field.includes('@images@')) field = field.replaceAll('@images@', this.getField('default', 'images'));
    if (field.includes('@groups@')) field = field.replaceAll('@groups@', this.getField('default', 'groups'));
    if (field.includes('@markers@')) field = field.replaceAll('@markers@', this.getField('default', 'markers'));
    if (field.includes('@galleries@')) field = field.replaceAll('@galleries@', this.getField('default', 'galleries'));
    if (field.includes('@performers@')) field = field.replaceAll('@performers@', this.getField('default', 'performers'));
    if (field.includes('@studios@')) field = field.replaceAll('@studios@', this.getField('default', 'studios'));
    if (field.includes('@tags@')) field = field.replaceAll('@tags@', this.getField('default', 'tags'));
    if (field.includes('@folder@')) field = field.replaceAll('@folder@', this.getField('default', 'folder'));
    if (field.includes('@baseFile@')) field = field.replaceAll('@baseFile@', this.getField('default', 'baseFile'));
    if (field.includes('@videoFile@')) field = field.replaceAll('@videoFile@', this.getField('default', 'videoFile'));
    if (field.includes('@imageFile@')) field = field.replaceAll('@imageFile@', this.getField('default', 'imageFile'));
    if (field.includes('@caption@')) field = field.replaceAll('@caption@', this.getField('default', 'caption'));
    if (field.includes('@videoPath@')) field = field.replaceAll('@videoPath@', this.getField('default', 'videoPath'));
    if (field.includes('@imagePath@')) field = field.replaceAll('@imagePath@', this.getField('default', 'imagePath'));
    if (field.includes('@galleryPath@')) field = field.replaceAll('@galleryPath@', this.getField('default', 'galleryPath'));
    if (field.includes('@sceneStream@')) field = field.replaceAll('@sceneStream@', this.getField('default', 'sceneStream'));
    if (field.includes('@chapter@')) field = field.replaceAll('@chapter@', this.getField('default', 'chapter'));
    if (field.includes('@stashID@')) field = field.replaceAll('@stashID@', this.getField('default', 'stashID'));
    if (field.includes('@')) field = this.removeField(field);
    return field;
};

/**
 * Preload All stash objects and cache it
 */
skStash.prototype.preLoad = function () {
    this.findScenes();
    this.findImages();
    this.findGroups();
    this.findMarkers();
    this.findGalleries();
    this.findPerformers();
    this.findStudios();
    this.findTags();
}

//BOOKMARK skStash.Find

/**
 * Return the correct field_filter for find query
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @returns {string} category_filter;
 */
skStash.prototype.findFieldFilter = function (category) {
    if (category === 'scenes') return 'scene_filter';
    if (category === 'images') return 'image_filter';
    if (category === 'groups') return 'group_filter';
    if (category === 'markers') return 'scene_marker_filter';
    if (category === 'galleries') return 'gallery_filter';
    if (category === 'performers') return 'performer_filter';
    if (category === 'studios') return 'studio_filter';
    if (category === 'tags') return 'tag_filter';
};

/**
 * Return the full query replacing placeholders
 * @param {string} query Base query of category type
 * @param {object} configuration Filter object
 * @param {boolean} configuration.exact If the query should look only for the most corresponding result
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash Category find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @returns {string} Full query
 */
skStash.prototype.findFormatQuery = function (query, configuration, category) {
    const value = this.formatField(this.getField('default', category));
    const search = configuration.filter.q;
    let filterList = '';
    let fieldFilterName = this.findFieldFilter(category);
    let filter = JSON.stringify(configuration.filter);
    let fieldFilter = JSON.stringify(configuration.fieldFilter);
    let ids = JSON.stringify(configuration.ids);

    if (configuration.filter) filterList += `filter:${filter}`;
    if (configuration.fieldFilter) filterList += `,${fieldFilterName}:${fieldFilter}`;
    if (configuration.ids) filterList += `,ids:${ids}`;

    filterList = filterList.replaceAll('"', '').replace(`q:${search}`, `q:"${search}"`);
    query = query.replace('@configuration@', filterList);
    query = query.replace('@field@', value);

    return query
};

/**
 * Check if the find filter.q will be the id or a string
 * @param {string|number} search String to search or specific id
 * @returns {boolean}
 */
skStash.prototype.findIsID = function (search) {
    if (typeof search === Number || !isNaN(search)) return true
};

/**
 * If need to search all replace the string
 * @param {string} search Search string
 * @returns {string} Search query
 */
skStash.prototype.findAllSearch = function (search) {
    if (!search || search === '' || search === 'all') return '';
    return search;
};

/**
 * Check if need to find all items or search for something
 * @param {string|number} search String to search or specific id
 * @returns {string} Search query
 */
skStash.prototype.findSetSearch = function (search) {
    if (this.findIsID(search)) search = '';
    search = this.findAllSearch(search);
    return search;
};

/**
 * If the filter.per_page is not defined set it based on configuration.exact
 * @param {object} configuration Filter object
 * @param {boolean} configuration.exact If the query should look only for the most corresponding result
 * @param {object} configuration.filter Stash general find filter
 * @param {number} configuration.filter.per_page How many item will search
 * @returns {object} Configuration with setted filter.per_page (default 1 if exact or -1)
 */
skStash.prototype.findSetResult = function (configuration) {
    const exact = configuration.exact;
    let per_page = configuration.filter.per_page;
    if (exact) per_page = 1;
    if (!exact && !per_page) per_page = -1;
    configuration.filter.per_page = per_page;
    return configuration;
};

/**
 * Return the base query based on the given category
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @returns {string} Base query for category
 */
skStash.prototype.findSetQuery = function (category) {
    const uppercase = category[0].toUpperCase() + category.slice(1);
    if (category !== 'markers') return `query {find${uppercase}(@configuration@){${category}{@field@}}}`
    return 'query {findSceneMarkers(@configuration@){scene_markers{@field@}}}';
};

/**
 * Return the correct response based on the given category
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} response Fetched data
 * @returns {object} Category response
 */
skStash.prototype.findGetResponse = function (category, response) {
    const uppercase = category[0].toUpperCase() + category.slice(1);
    if (category !== 'markers') return response[`find${uppercase}`][category];
    return response[`findSceneMarkers`][`scene_markers`];
};

/**
 * Return the correct response based on the given id
 * @param {string|number} id Id to find
 * @param {object} response Fetched data
 * @returns {object} Id response
 */
skStash.prototype.findSearchId = function (id, response) {
    let find = false;
    response.forEach((item) => {
        if (item.id == id || item.name == id || item.title == id) find = item;
    });
    return find;
};

/**
 * Initialize the find query and send the request
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {string|number} search String to search or exact id
 * @param {object} configuration Filter object
 * @param {boolean} configuration.exact If the query should look only for the most corresponding result
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash Category find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Response data
 * @async
 */
skStash.prototype.findDo = async function (category, search, configuration) {
    if (!configuration.filter) configuration.filter = {};
    configuration.filter.q = this.findSetSearch(search);
    configuration = this.findSetResult(configuration);

    if (this.getCache(category) && !configuration.fieldFilter) return this.findCache(category, configuration.filter);

    let query = this.findSetQuery(category);
    query = this.findFormatQuery(query, configuration, category);
    let response = await this.GQL(query);
    response = this.findGetResponse(category, response);
    if (configuration.exact) response = this.findSearchId(search, response);
    return response;
};

/**
 * Search for scenes
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash scene find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Scenes data
 * @async
 */
skStash.prototype.findScenes = async function (search, configuration) {
    const category = 'scenes';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for scene
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash scene find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Scene data
 * @async
 */
skStash.prototype.findScene = async function (search, configuration) {
    const category = 'scenes';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

/**
 * Search for images
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash image find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Images data
 * @async
 */
skStash.prototype.findImages = async function (search, configuration) {
    const category = 'images';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for image
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash image find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Image data
 * @async
 */
skStash.prototype.findImage = async function (search, configuration) {
    const category = 'images';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

/**
 * Search for groups
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash group find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Groups data
 * @async
 */
skStash.prototype.findGroups = async function (search, configuration) {
    const category = 'groups';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for group
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash group find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Group data
 * @async
 */
skStash.prototype.findGroup = async function (search, configuration) {
    const category = 'groups';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

/**
 * Search for markers
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash marker find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Markers data
 * @async
 */
skStash.prototype.findMarkers = async function (search, configuration) {
    const category = 'markers';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for marker
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash marker find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Marker data
 * @async
 */
skStash.prototype.findMarker = async function (search, configuration) {
    const category = 'markers';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

/**
 * Search for galleries
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash gallery find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Galleries data
 * @async
 */
skStash.prototype.findGalleries = async function (search, configuration) {
    const category = 'galleries';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for gallery
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash gallery find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Gallery data
 * @async
 */
skStash.prototype.findGallery = async function (search, configuration) {
    const category = 'galleries';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

/**
 * Search for performers
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash performer find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Performers data
 * @async
 */
skStash.prototype.findPerformers = async function (search, configuration) {
    const category = 'performers';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for performer
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash performer find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Performer data
 * @async
 */
skStash.prototype.findPerformer = async function (search, configuration) {
    const category = 'performers';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

/**
 * Search for studios
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash studio find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Studios data
 * @async
 */
skStash.prototype.findStudios = async function (search, configuration) {
    const category = 'studios';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for studio
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash studio find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Studio data
 * @async
 */
skStash.prototype.findStudio = async function (search, configuration) {
    const category = 'studios';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

/**
 * Search for tags
 * @param {string|number} search String to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash tag find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Tags data
 * @async
 */
skStash.prototype.findTags = async function (search, configuration) {
    const category = 'tags';
    if (!configuration) configuration = {};
    configuration.exact = false;
    const result = await this.findDo(category, search, configuration);
    if (this.findAllSearch(search) === '') this.setCache(category, result);
    return result
};

/**
 * Search for tag
 * @param {string|number} search Id to search
 * @param {object} [configuration] Filter object
 * @param {object} [configuration.filter] Stash general find filter
 * @param {object} [configuration.fieldFilter] Stash tag find filter
 * @param {array.<number>} [configuration.ids] Specific ids to find
 * @returns {object} Tag data
 * @async
 */
skStash.prototype.findTag = async function (search, configuration) {
    const category = 'tags';
    if (!configuration) configuration = {};
    configuration.exact = true;
    const result = await this.findDo(category, search, configuration);
    return result
};

//BOOKMARK skStash.Update

/**
 * Return the full query replacing placeholder
 * @param {string} query Base query for category
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @returns {string} Full query
 */
skStash.prototype.updateFormatQuery = function (query, category) {
    let field = category === 'gallery' ? 'galleries' : `${category}s`;
    field = this.getField('default', field);
    const value = this.formatField(field);
    query = query.replace('@input@', value);
    return query;
};

/**
 * Get the base query based on given category
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {boolean} multiple If need to update multiple object
 * @returns {string} Base query
 */
skStash.prototype.updateSetQuery = function (category, multiple) {
    const upperCase = category[0].toUpperCase() + category.slice(1);
    if (multiple && category !== 'marker') return `mutation bulk${upperCase}Update($input:Bulk${upperCase}UpdateInput!){bulk${upperCase}Update(input:$input){@input@}}`;
    if (multiple && category === 'marker') return 'mutation bulkSceneMarkerUpdate($input:BulkSceneMarkerUpdateInput!){bulkSceneMarkerUpdate(input:$input){@input@}}';
    if (!multiple && category !== 'marker') return `mutation ${category}Update($input:${upperCase}UpdateInput!){${category}Update(input:$input){@input@}}`;
    if (!multiple && category === 'marker') return 'mutation sceneMarkerUpdate($input:sceneMarkerUpdateInput!){sceneMarkerUpdate(input:$input){@input@}}';
};

/**
 * Return the correct response based on the given category
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} response Fetched data
 * @returns {object} Category response
 */
skStash.prototype.updateGetResponse = function (category, response) {
    if (category !== 'marker') return response[`${category}Update`];
    return response[`markerUpdate`];
};

/**
 * Initialize the update query and send the request
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} input Stash or StashDB input data
 * @param {boolean} multiple If need to update multiple object
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateDo = async function (category, input, multiple) {
    let query = this.updateSetQuery(category, multiple);
    query = this.updateFormatQuery(query, category);
    if (input._type === 'stashDB') input = await sk.stashDB.toStash(input);
    const response = await this.GQL(query, input);
    return this.updateGetResponse(category, response);
};

/**
 * Update multiple scenes
 * @param {object} input Scene object
 * @param {array.<number>} input.ids Scenes ids to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateScenes = async function (input) {
    const response = await this.updateDo('scene', input, true);
    this.setCache('scenes', null);
    return response;
};

/**
 * Update scene
 * @param {object} input Scene object
 * @param {number} input.id Scene id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateScene = async function (input) {
    const response = await this.updateDo('scene', input, false);
    if (this.getCache('scenes')) this.setCache('scenes', input);
    return true
    return response;
};

/**
 * Update multiple images
 * @param {object} input Image object
 * @param {array.<number>} input.ids Images ids to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateImages = async function (input) {
    const response = await this.updateDo('image', input, true);
    this.setCache('images', null);
    return response;
};

/**
 * Update image
 * @param {object} input Image object
 * @param {number} input.id Image id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateImage = async function (input) {
    const response = await this.updateDo('image', input, false);
    if (this.getCache('images')) this.setCache('images', input);
    return response;
};

/**
 * Update multiple groups
 * @param {object} input Group object
 * @param {array.<number>} input.ids Groups ids to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateGroups = async function (input) {
    const response = await this.updateDo('group', input, true);
    this.setCache('groups', null);
    return response;
};

/**
 * Update group
 * @param {object} input Group object
 * @param {number} input.id Group id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateGroup = async function (input) {
    const response = await this.updateDo('group', input, false);
    if (this.getCache('groups')) this.setCache('groups', input);
    return response;
};

/**
 * Update multiple markers
 * @param {object} input Marker object
 * @param {array.<number>} input.ids Markers ids to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateMarkers = async function (input) {
    const response = await this.updateDo('marker', input, true);
    this.setCache('markers', null);
    return response;
};

/**
 * Update marker
 * @param {object} input Marker object
 * @param {number} input.id Marker id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateMarker = async function (input) {
    const response = await this.updateDo('marker', input, false);
    if (this.getCache('markers')) this.setCache('markers', input);
    return response;
};

/**
 * Update multiple galleries
 * @param {object} input Gallery object
 * @param {array.<number>} input.ids Galleries ids to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateGalleries = async function (input) {
    const response = await this.updateDo('gallery', input, true);
    this.setCache('galleries', null);
    return response;
};

/**
 * Update gallery
 * @param {object} input Gallery object
 * @param {number} input.id Gallery id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateGallery = async function (input) {
    const response = await this.updateDo('gallery', input, false);
    if (this.getCache('galleries')) this.setCache('galleries', input);
    return response;
};

/**
 * Update multiple performers
 * @param {object} input Performer object
 * @param {array.<number>} input.ids Performers ids to update
 * @returns {object} Performer data
 * @async
 */
skStash.prototype.updatePerformers = async function (input) {
    const response = await this.updateDo('performer', input, true);
    this.setCache('performers', null);
    return response;
};

/**
 * Update performer
 * @param {object} input Performer object
 * @param {number} input.id Performer id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updatePerformer = async function (input) {
    const response = await this.updateDo('performer', input, false);
    if (this.getCache('performers')) this.setCache('performers', input);
    return response;
};

/**
 * Update multiple studios
 * @param {object} input Studio object
 * @param {array.<number>} input.ids Studios ids to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateStudios = async function (input) {
    const response = await this.updateDo('studio', input, true);
    this.setCache('studios', null);
    return response;
};

/**
 * Update studio
 * @param {object} input Studio object
 * @param {number} input.id Studio id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateStudio = async function (input) {
    const response = await this.updateDo('studio', input, false);
    if (this.getCache('studios')) this.setCache('studios', input);
    return response;
};

/**
 * Update multiple tags
 * @param {object} input Tag object
 * @param {array.<number>} input.ids Tags ids to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateTags = async function (input) {
    const response = await this.updateDo('tag', input, true);
    this.setCache('tags', null);
    return response;
};

/**
 * Update tag
 * @param {object} input Tag object
 * @param {number} input.id Tag id to update
 * @returns {object} Updated data
 * @async
 */
skStash.prototype.updateTag = async function (input) {
    const response = await this.updateDo('tag', input, false);
    if (this.getCache('tags')) this.setCache('tags', input);
    return response;
};

//BOOKMARK skStash.Create

/**
 * Format the creation query replacing field placeholder
 * @param {string} query
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @returns {string} Full query
 */
skStash.prototype.createFormatQuery = function (query, category) {
    if (category !== 'gallery') category += 's';
    if (category === 'gallery') category = 'galleries';
    const value = this.formatField(this.getField('default', category));
    query = query.replace('@input@', value);
    return query;
};

/**
 * Set the creation query
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @returns {string} Query
 */
skStash.prototype.createSetQuery = function (category) {
    const upperCase = category[0].toUpperCase() + category.slice(1);
    if (category !== 'marker') return `mutation ${category}Create($input:${upperCase}CreateInput!){${category}Create(input: $input){@input@}}`
    return 'mutation sceneMarkerCreate($input:SceneMarkerCreateInput!){sceneMarkerCreate(input: $input){@input@}}';
};


/**
 * Return the correct response based on the given category
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} response Fetched data
 * @returns {object} Category response
 */
skStash.prototype.createGetResponse = function (category, response) {
    if (category !== 'marker') return response[`${category}Create`];
    return response['sceneMarkerCreate'];
};

/**
 * Initialize the creation query and send the request
 * @param {string} category scenes|images|groups|markers|galleries|performers|studios|tags
 * @param {object} input Data of the new object
 * @returns {object} Created data
 * @async
 */
skStash.prototype.createDo = async function (category, input) {
    let query = this.createSetQuery(category);
    query = this.createFormatQuery(query, category);
    const response = await this.GQL(query, input);
    return this.createGetResponse(category, response);
};

/**
 * Create a new scene
 * @param {object} input Scene data
 * @returns {object} Scene created data
 * @async
 */
skStash.prototype.createScene = async function (input) {
    const created = await this.createDo('scene', input);
    this.updateCache('scenes', created);
    return created;
};

/**
 * Create a new image
 * @param {object} input Image data
 * @returns {object} Image created data
 * @async
 */
skStash.prototype.createImage = async function (input) {
    const created = await this.createDo('image', input);
    this.updateCache('images', created);
    return created;
};

/**
 * Create a new group
 * @param {object} input Group data
 * @returns {object} Group created data
 * @async
 */
skStash.prototype.createGroup = async function (input) {
    const created = await this.createDo('group', input);
    this.updateCache('groups', created);
    return created;
};

/**
 * Create a new marker
 * @param {object} input Marker data
 * @returns {object} Marker created data
 * @async
 */
skStash.prototype.createMarker = async function (input) {
    const created = await this.createDo('marker', input);
    this.updateCache('markers', created);
    return created;
};

/**
 * Create a new gallery
 * @param {object} input Gallery data
 * @returns {object} Gallery created data
 * @async
 */
skStash.prototype.createGallery = async function (input) {
    const created = await this.createDo('gallery', input);
    this.updateCache('galleries', created);
    return created;
};

/**
 * Create a new performer
 * @param {object} input Performer data
 * @returns {object} Performer created data
 * @async
 */
skStash.prototype.createPerformer = async function (input) {
    const created = await this.createDo('performer', input);
    this.updateCache('performers', created);
    return created;
};

/**
 * Create a new studio
 * @param {object} input Studio data
 * @returns {object} Studio created data
 * @async
 */
skStash.prototype.createStudio = async function (input) {
    const created = await this.createDo('studio', input);
    this.updateCache('studios', created);
    return created;
};

/**
 * Create a new tag
 * @param {object} input Tag data
 * @returns {object} Tag created data
 * @async
 */
skStash.prototype.createTags = async function (input) {
    const created = await this.createDo('tag', input);
    this.updateCache('tags', created);
    return created;
};

//BOOKMARK skPlugins
/**
 * The Plugins module
 * @constructor
 */
function skPlugins() {
    this.initialize.call(this);
};

/**
 * Check if the module skPlugins is already initializated
 * @returns {boolean}
 */
skPlugins.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Set Stash plugins
 */
skPlugins.prototype.setAll = function () {
    this._plugins = sk.stash.getConfiguration().plugins;
};

/**
 * Get Stash plugins
 * @returns {object} Plugins
 */
skPlugins.prototype.getAll = function () {
    return this._plugins;
};

/**
 * Initialize the module
 * @returns If is already initialized
 * @async
 */
skPlugins.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this.setAll();
    this._initializated = true;
};

/**
 * Check if the given plugin exist
 * @param {string} name Plugin id
 * @returns {boolean}
 */
skPlugins.prototype.exist = function (name) {
    return this.getAll()[name] ? true : false;
};

/**
 * Get selected plugin configuration
 * @param {string} name Plugin id
 * @returns {object|boolean} Plugin data or false if the plugin does not exist
 */
skPlugins.prototype.get = function (name) {
    if (!this.exist(name)) return false;
    return this.getAll()[name];
};

/**
 * Set plugin data
 * @param {string} name Plugin id
 * @param {object} option Plugin configuration
 * @param {any} [value] Plugin configuration value
 * @returns {boolean} False if the plugin does not exist
 */
skPlugins.prototype.set = function (name, option, value) {
    if (!this.exist(name)) return false;
    if (!name || !option) throw Error('Name & option must be defined', name, option);
    this._plugins[name] = option || false;
    this.update(name, this.get(name));
};

/**
 * Replace plugin data
 * @param {string} name Plugin id
 * @param {object} option Plugin configuration
 * @returns {boolean} False if the plugin does not exist
 */
skPlugins.prototype.replace = function (name, option) {
    if (!this.exist(name)) return false;
    if (!name || !option) throw Error('Name & option must be defined', name, option);
    let plugin = this.get(name);
    plugin = option;
    this.set(name, plugin);
};

/**
 * Prepare the update query
 * @param {string} name Plugin id
 * @param {object} option Plugin configuration
 * @returns {string} Query
 */
skPlugins.prototype.prepareQuery = function (name, plugin) {
    return query = `mutation configurePlugin(plugin_id:${name}, input:${input})`;
};

/**
 * Update the plugin settings
 * @param {string} name Plugin id
 * @param {object} option Plugin configuration
 * @returns {any}
 */
skPlugins.prototype.update = async function (name, plugin) {
    if (!name || !option) throw Error('Name & option must be defined', name, option);
    const result = sk.stash.GQL(this.prepareQuery(name, plugin));
    return result;
};

//BOOKMARK skStashDB
/**
 * The StashDB module
 * @constructor
 */
function skStashDB() {
    this.initialize.call(this);
};

/**
 * Check if the module skStashDB is already initializated
 * @returns {boolean}
 */
skStashDB.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Set StashDB configuration
 */
skStashDB.prototype.setConfiguration = function () {
    this._configuration = sk.stash.findStashBox('stashdb');
};

/**
 * Get StashDB configuration
 * @returns {object} StashDB configuration
 */
skStashDB.prototype.getConfiguration = function () {
    return this._configuration;
};

/**
 * Set GraphQL url
 */
skStashDB.prototype.setGQL = function () {
    this._gql = this.getConfiguration().endpoint;
};

/**
 * Get GraphQL url
 * @returns {string} GraphQL url
 */
skStashDB.prototype.getGQL = function () {
    return this._gql;
};

/**
 * Set StashDB api key
 */
skStashDB.prototype.setApiKey = function () {
    this._apiKey = this.getConfiguration().api_key;
};

/**
 * Get StashDB api key
 * @returns {string} Api key
 */
skStashDB.prototype.getApiKey = function () {
    return this._apiKey;
};

/**
 * Set the default headers for GraphQL
 */
skStashDB.prototype.setHeaders = function () {
    this._headers = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ApiKey': this.getApiKey()
        },
        variables: {}
    };
};

/**
 * Get the default headers for GraphQL
 * @returns {object} Headers data
 */
skStashDB.prototype.getHeaders = function () {
    return this._headers;
};

/**
 * Set field placeholder
 */
skStashDB.prototype.setField = function () {
    this._field = {
        scene: 'id code release_date production_date title details director urls { url } images { url } studio {@studio@} performers { performer {@performer@} } tags {@tag@}',
        studio: 'id name aliases urls { url } parent { name } child_studios { name }',
        performer: 'id name disambiguation aliases gender birth_date death_date age height hair_color eye_color ethnicity country career_end_year career_start_year breast_type waist_size hip_size band_size cup_size tattoos { location description } piercings { location description } urls { url } images { url }',
        tag: 'id name description aliases'
    };
};

/**
 * get given field placeholder
 * @param {string} field
 * @returns {string} Field placeholder
 */
skStashDB.prototype.getField = function (field) {
    return this._field[field];
};

/**
 * Initialize skStashDB module
 * @returns If is already initialized
 * @async
 */
skStashDB.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this.setConfiguration();
    this.setGQL();
    this.setApiKey();
    this.setHeaders();
    this.setBaseQuery();
    this.setCategoryQuery();
    this.setField();
    this._initializated = true;
};

/**
 * Send a request to GraphQL interface
 * @param {any} query
 * @param {any} search
 * @returns {object} Result data
 * @async
 */
skStashDB.prototype.GQL = async function (query, search) {
    if (!query) throw Error('Query must be defined', query);
    let configuration = this.getHeaders();
    configuration.body = JSON.stringify({ query: query, variables: { limit: 1, term: search } });
    const response = await fetch(this.getGQL(), configuration);
    let result = await response.json();
    result._type = 'stashDB';
    return result;
};

/**
 * Set the base query placeholder
 */
skStashDB.prototype.setBaseQuery = function () {
    this._baseQuery = 'query SearchAll($term:String!,$limit:Int=5){@category@}';
};

/**
 * Get the base query placeholder
 * @returns {string} Query placeholder
 */
skStashDB.prototype.getBaseQuery = function () {
    return this._baseQuery;
};

/**
 * Set the query placeholder based on category
 */
skStashDB.prototype.setCategoryQuery = function () {
    this._categoryQuery = {
        scene: 'searchScene(term:$term,limit:$limit){@scene@}',
        studio: 'searchStudio(term:$term,limit:$limit){@studio@}',
        performer: 'searchPerformer(term:$term,limit:$limit){@performer@}',
        tag: 'searchTag(term:$term,limit:$limit){@tag@}'
    };
};

/**
 * Get the query placeholder based on category
 * @param {string} category
 * @returns {string} Query placeholder
 */
skStashDB.prototype.getCategoryQuery = function (category) {
    return this._categoryQuery[category];
}

/**
 * Replace all the filed placeholder and return the complete query
 * @param {string} query
 * @returns {string} Complete query
 */
skStashDB.prototype.formatField = function (query) {
    if (query.includes('@scene@')) query = query.replace('@scene@', this.getField('scene'));
    if (query.includes('@studio@')) query = query.replace('@studio@', this.getField('studio'));
    if (query.includes('@performer@')) query = query.replace('@performer@', this.getField('performer'));
    if (query.includes('@tag@')) query = query.replace('@tag@', this.getField('tag'));
    return query;
};

/**
 * Return the full query replacing the category placeholder
 * @param {string} category Category of the query
 * @returns {string} Full query
 */
skStashDB.prototype.formatQuery = function (category) {
    let query = this.getBaseQuery();
    query = query.replace('@category@', this.getCategoryQuery(category));
    query = this.formatField(query);
    return query;
};

/**
 * Search a StashDB scene
 * @param {string} search
 * @returns {object} StashDB scene data
 * @async
 */
skStashDB.prototype.scene = async function (search) {
    const query = this.formatQuery('scene');
    let data = await this.GQL(query, search);
    data = data.data.searchScene[0];
    if (data) data._category = 'Scene';
    return data;
};

/**
 * Search a StashDB performer
 * @param {string} search
 * @returns {object} StashDB performer data
 * @async
 */
skStashDB.prototype.performer = async function (search) {
    const query = this.formatQuery('performer');
    let data = await this.GQL(query, search);
    data = data.data.searchPerformer[0];
    if (data) data._category = 'Performer';
    return data;
};

/**
 * Search a StashDB studio
 * @param {string} search
 * @returns {object} StashDB studio data
 * @async
 */
skStashDB.prototype.studio = async function (search) {
    const query = this.formatQuery('studio');
    let data = await this.GQL(query, search);
    data = data.data.searchStudio[0];
    if (data) data._category = 'Studio';
    return data;
};

/**
 * Search a StashDB tag
 * @param {string} search
 * @returns {object} StashDB tag data
 * @async
 */
skStashDB.prototype.tag = async function (search) {
    const query = this.formatQuery('tag');
    let data = await this.GQL(query, search);
    data = data.data.searchTag[0];
    if (data) data._category = 'Tag';
    return data;
};

/**
 * Return a stashID instance
 * @param {string} idDB StashDB id
 * @returns {array.<object>} StashID instance
 */
skStashDB.prototype.toStashIDs = function (idDB) {
    const date = new Date();
    return [{ stash_id: idDB, endpoint: this.getGQL(), updated_at: date.toISOString() }];
};

/**
 * Transform StashDB urls in Stash urls
 * @param {array.<object>} urlsDB StashDB urls
 * @returns {array.<string>} Stash urls
 */
skStashDB.prototype.toStashURL = function (urlsDB) {
    let urls = [];
    urlsDB.forEach((url) => {
        urls.push(url.url);
    });
    return urls;
};

/**
 * Check if the StashDB studio already exist inside Stash
 * @param {object} studio StashDB studio
 * @returns {number|boolean} Stash id or false
 * @async
*/
skStashDB.prototype.studioExist = async function (studio) {
    if (!studio || !isNaN(studio)) return;
    let find = false;
    find = await sk.stash.findStudio(studio.name);
    if (!find) for (alias of studio.aliases) {
        if (!find) find = await sk.stash.findStudio(alias);
    };
    return find.id || studio;
};

/**
 * Check if the StashDB performers already exist inside Stash
 * @param {array.<object>} performers StashDB performers
 * @returns {object} Find and notFind array
 * @async
*/
skStashDB.prototype.performersExist = async function (performers) {
    if (!performers || !isNaN(performers[0])) return { find: performers };
    let find = false;
    let ids = { find: [], notFind: [] };
    for (let performer of performers) {
        performer = performer.performer;
        find = await sk.stash.findPerformer(performer.name);
        if (!find) for (alias of performer.aliases) {
            if (!find) find = await sk.stash.findPerformer(alias);
        };
        find ? ids.find.push(find.id) : ids.notFind.push(performer);
        find = false;
    };
    return ids;
};

/**
 * Check if the StashDB tags already exist inside Stash
 * @param {array.<object>} tags StashDB tags
 * @returns {object} Find and notFind array
 * @async
*/
skStashDB.prototype.tagsExist = async function (tags) {
    if (!tags || !isNaN(tags[0])) return { find: tags };
    let find = false;
    let ids = { find: [], notFind: [] };

    for (tag of tags) {
        find = await sk.stash.findTag(tag.name);
        if (!find) for (alias of tag.aliases) {
            if (!find) find = await sk.stash.findTag(alias);
        };
        find ? ids.find.push(find.id) : ids.notFind.push(find.id);
        find = false;
    };
    return ids;
};

/**
 * Transform StashDB scene data in Stash scene data
 * @param {object} sceneDB StashDB scene data
 * @param {string} sceneDB.id Scene StashDB id
 * @param {string} sceneDB.title Scene title
 * @param {array.<object>} sceneDB.images Scene images
 * @param {string|number} sceneDB.code Scene code
 * @param {string} sceneDB.details Scene details
 * @param {string} sceneDB.director Scene director
 * @param {array.<object>} sceneDB.urls Scene urls data
 * @param {string} sceneDB.release_date Scene release date (yyyy-mm-dd)
 * @param {object} sceneDB.studio Scene studio
 * @param {array.<object>} sceneDB.performers Scene performers
 * @param {array.<object>} sceneDB.tags Scene tags
 * @param {number|string} [sceneId] Stash scene id to update
 * @param {boolean} find If return not found data
 * @returns {object} Stash scene data
 * @async
 */
skStashDB.prototype.toStashScene = async function (sceneDB, sceneId, find) {
    let scene = {};
    const studio = await this.studioExist(sceneDB.studio);
    const performers = await this.performersExist(sceneDB.performers);
    const tags = await this.tagsExist(sceneDB.tags);

    if (sceneId !== undefined) scene.id = sceneId;
    if (sceneDB.images) scene.cover_image = sceneDB.images[0].url;
    if (sceneDB.title) scene.title = sceneDB.title;
    if (sceneDB.code) scene.code = sceneDB.code;
    if (sceneDB.details) scene.details = sceneDB.details;
    if (sceneDB.director) scene.director = sceneDB.director;
    if (sceneDB.urls) scene.urls = this.toStashURL(sceneDB.urls);
    if (sceneDB.release_date) scene.date = scene.release_date;
    if (sceneDB.id) scene.stash_ids = this.toStashIDs(sceneDB.id);
    if (!isNaN(studio)) scene.studio_id = studio;
    scene.performer_ids = performers.find;
    scene.tag_ids = tags.find;

    if (find) {
        if (isNaN(studio)) find.studio = studio;
        if (performers.notFind) find.performers = performers.notFind;
        if (tags.notFind) find.tags = tags.notFind;
    };
    return find ? { scene: scene, find: find } : scene;
};

/**
 * Return a string of Tattoos or Piercings
 * @param {array.<object>} listDB Tattoos or Piercings list of StashDB
 * @returns {string} Stash compatible tattoos or piercings
 */
skStashDB.prototype.toStashTattoosPiercings = function (listDB) {
    let list = [];
    if (listDB) listDB.forEach((item) => {
        const description = item.description;
        const location = item.location;
        let toStash = description;
        if (location) toStash = `${toStash} (${location})`;
        list.push(toStash);
    });
    return list.join(', ');
};

/**
 * Transform StashDB scene data in Stash scene data
 * @param {object} performerDB StashDB performer data
 * @param {string} performerDB.id StashDB performer id
 * @param {string} performerDB.name Performer name
 * @param {string} performerDB.disambiguation Performer disambiguation
 * @param {array.<object>} performerDB.urls Performer urls data
 * @param {string} performerDB.gender Performer gender
 * @param {string} performerDB.birth_date Performer birth date (yyyy-mm-dd)
 * @param {string} performerDB.ethnicity Performer ethnicity
 * @param {string} performerDB.country Performer country code
 * @param {string} performerDB.eye_color Performer eyes color
 * @param {number} performerDB.height Performer height in cm
 * @param {number} performerDB.band_size Performer band size
 * @param {string} performerDB.cup_size Performer cup size
 * @param {number} performerDB.waist_size Performer waist size
 * @param {number} performerDB.hip_size Performer hip size
 * @param {string} performerDB.breast_type Performer breast type natural|augmented
 * @param {number} performerDB.penis_length Performer penis length in cm
 * @param {string} performerDB.circumcised Performer circumcised cut|uncut
 * @param {string} performerDB.career_start_year Performer career starting year
 * @param {string} performerDB.career_end_year Performer career ending year
 * @param {array.<object>} performerDB.tattoos Performer tattoos list
 * @param {array.<object>} performerDB.piercings Performer piercings list
 * @param {array.<string>} performerDB.aliases Performer aliases list
 * @param {string} performerDB.death_date Performer death date (yyyy-mm-dd)
 * @param {string} performerDB.hair_color Performer hair color
 * @param {number} performerDB.weight Performer weight in kg
 * @param {number|string} [performerId] Stash performer id to update
 * @returns {object} Stash performer data
 * @async
 */
skStashDB.prototype.toStashPerformer = async function (performerDB, performerId) {
    let performer = {};
    if (performerId !== undefined) performer.id = performerId;
    if (performerDB.images) performer.image = performerDB.images[0].url;
    if (performerDB.name) performer.name = performerDB.name;
    if (performerDB.disambiguation) performer.disambiguation = performerDB.disambiguation;
    if (performerDB.urls) performer.urls = this.toStashURL(performerDB.urls);
    if (performerDB.gender) performer.gender = performerDB.gender;
    if (performerDB.birthdate) performer.birthdate = performerDB.birth_date
    if (performerDB.ethnicity) performer.ethnicity = performerDB.ethnicity[0] + performerDB.ethnicity.slice(1).toLowerCase();
    if (performerDB.country) performer.country = performerDB.country;
    if (performerDB.eye_color) performer.eye_color = performerDB.eye_color;
    if (performerDB.height) performer.height_cm = performerDB.height;
    if (performerDB.band_size && performerDB.cup_size && performerDB.waist_size && performerDB.hip_size) performer.measurements = `${performerDB.band_size}${performerDB.cup_size}-${performerDB.waist_size}-${performerDB.hip_size}`;
    if (performerDB.breast_type) performer.fake_tits = performerDB.breast_type[0] + performerDB.breast_type.slice(1).toLowerCase();
    if (performerDB.penis_length) performer.penis_length = performerDB.penis_length;
    if (performerDB.circumcised) performer.circumcised = performerDB.circumcised;
    if (performerDB.career_start_year) performer.career_length = performerDB.career_end_year ? `${performerDB.career_start_year} -` : `${performerDB.career_start_year} - ${performerDB.career_end_year}`;
    if (performerDB.tattoos) performer.tattoos = this.toStashTattoosPiercings(performerDB.tattoos);
    if (performerDB.piercings) performer.piercings = this.toStashTattoosPiercings(performerDB.piercings);
    if (performerDB.aliases) performer.alias_list = performerDB.aliases;
    if (performerDB.id) performer.stash_ids = this.toStashIDs(performerDB.id);
    if (performerDB.death_date) performer.death_date = performerDB.death_date;
    if (performerDB.hair_color) performer.hair_color = performerDB.hair_color[0] + performerDB.hair_color.slice(1).toLowerCase();
    if (performerDB.weight) performer.weight = performerDB.weight;
    return performer;
};

/**
 * Transform StashDB studio data in Stash studio data
 * @param {object} studioDB StashDB studio data
 * @param {string} studioDB.id StashDB studio id
 * @param {string} studioDB.name Studio name
 * @param {array.<string>} studioDB.aliases Studio aliases list
 * @param {array.<object>} studioDB.url Studio urls data
 * @param {object} studioDB.parent Studio parent object
 * @param {string|number} studioId Stash studio id to update
 * @param {boolean} find If return not found data
 * @returns {object} Stash studio data
 * @async
 */
skStashDB.prototype.toStashStudio = async function (studioDB, studioId, find) {
    let studio = {};
    const parent = await this.studioExist(studioDB.parent);

    if (studioId !== undefined) studio.id = studioId;
    if (studioDB.name) studio.name = studioDB.name;
    if (studioDB.aliases) studio.aliases = studioDB.aliases;
    if (studioDB.urls) studio.urls = this.toStashURL(studioDB.urls);
    if (studioDB.id) studio.stash_ids = this.toStashIDs(studioDB.id);
    if (!isNaN(parent)) studio.parent_id = parent.id;

    if (find) {
        if (isNaN(parent)) find.parent = parent;
    };
    return find ? { scene: scene, find: find } : studio;
};

/**
 * Transform StashDB tag data in Stash tag data
 * @param {object} tagDB StashDB tag data
 * @param {string} tagDB.id StashDB tag id
 * @param {string} tagDB.name Tag name
 * @param {string} tagDB.description Tag description
 * @param {array.<string>} tagDB.aliases Tag aliases list
 * @param {number|id} tagId Stash tag id to update
 * @returns {object} Stash tag data
 * @async
 */
skStashDB.prototype.toStashTag = async function (tagDB, tagId) {
    let tag = {};
    if (tagId !== undefined) tag.id = tagId;
    if (tagDB.name) tag.name = tagDB.name;
    if (tagDB.description) tag.description = tagDB.description;
    if (tagDB.aliases) tag.aliases = tagDB.aliases;
    if (tagDB.id) tag.stash_ids = this.toStashIDs(tagDB.id);
    return tag;
};

/**
 * Transform a StashDB data to Stash data and update it
 * @param {object} stashDB StashDB data
 * @param {number|string} id Stash id. If defined auto update the stash database
 * @returns
 */
skStashDB.prototype.toStash = async function (stashDB, id) {
    const stashData = await sk.stashDB[`toStash${stashDB._category}`](stashDB, id);
    if (id !== undefined) await sk.stash[`update${stashDB._category}`](stashData);
    return stashData;
};

//BOOKMARK skHook
/**
 * The Hook module
 * @constructor
 */
function skHook() {
    this.initialize.call(this);
};

/**
 * Check if the module skHook is already initializated
 * @returns {boolean}
 */
skHook.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Clone the default fetch
 */
skHook.prototype.setFetch = function () {
    this._fetch = window.fetch.bind(window);
};

/**
 * Return the cloned default fetch
 * @returns {function} Fetch
 */
skHook.prototype.getFetch = function () {
    return this._fetch;
};

/**
 * Set hook category
 */
skHook.prototype.setCategory = function () {
    this._category = ['scene', 'marker', 'image', 'gallery', 'group', 'performer', 'studio', 'tag'];
};

/**
 * Get hook category
 * @returns {array} Hook category
 */
skHook.prototype.getCategory = function () {
    return this._category;
};

/**
 * Set hook operation
 */
skHook.prototype.setOperation = function () {
    this._operation = ['create', 'update', 'destroy', 'merge'];
};

/**
 * Get hook operation 
 * @returns {array} Hook operation
 */
skHook.prototype.getOperation = function () {
    return this._operation;
};

/**
 * Prepare the watcher query and array
 */
skHook.prototype.setWatcher = function () {
    this._watch = {};
    const category = this.getCategory();
    const operation = this.getOperation();
    category.forEach((name) => {
        this._watch[name] = {};
    });
    operation.forEach((name) => {
        for (var cat in this._watch) {
            var upperCase = name[0].toUpperCase() + name.slice(1);
            if (name !== 'merge') {
                this._watch[cat][name] = { query: cat + upperCase, functions: [] };
            } else if (cat === 'tag') {
                this._watch[cat][name] = { query: cat + upperCase, functions: [] };
            }
        };
    });
};

/**
 * Return the selected watcher
 * @param {string} [category] scene|marker|image|gallery|group|performer|studio|tag
 * @param {string} [operation] create|update|destroy|merge
 * @returns {object} entire watch|watch[category]|watch[category][operation]
 */
skHook.prototype.getWatcher = function (category, operation) {
    if (!category && !operation) return this._watch;
    if (category && !operation) return this._watch[category];
    return this._watch[category][operation];
};

/**
 * Check if the current fetch is observed
 * @param {string} query Fetch query
 * @returns {object|boolean} watcher or false
 */
skHook.prototype.needWatch = function (query) {
    let needWatch = false;
    this.getOperation().forEach((name) => {
        for (var cat in this.getWatcher()) {
            var hook = this.getWatcher(cat, name);
            if (hook && query.includes(hook.query)) needWatch = hook;
        };
    });
    return needWatch;
};

/**
 * Parse the response and return the data
 * @param {function} callback Function to pass data
 * @param {promise} response Data fetched
 * @param {string} query Data type
 */
skHook.prototype.prepareResponse = async function (callback, response, query) {
    const data = await response.json();
    callback(data.data[query]);
};

/**
 * Set the custom fetch with the integrated observer
 * @returns {promise} Data fetched
 */
skHook.prototype.setFakeFetch = function () {
    window.fetch = function (...args) {
        let query
        if (args[1]) {
            args[1].signal = null;
            query = args[1].body;
        };
        const gql = args[0];
        let watch = false;
        if (gql === 'http://localhost:9999/graphql' || gql === '/graphql') watch = sk.hook.needWatch(query);
        return Promise.resolve(sk.hook.getFetch().apply(window, args))
            .then((resp) => {
                if (watch.functions) watch.functions.forEach((watcher) => {
                    const resp2 = resp.clone();
                    sk.hook.prepareResponse(watcher, resp2, watch.query);
                });
                return resp;
            })
    };
};

/**
 * Initialize the module
 * @returns If is already initialized
 * @async
 */
skHook.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this.setFetch();
    this.setCategory();
    this.setOperation();
    this.setWatcher();
    this.setFakeFetch();
    this._initializated = true;
};

/**
 * Check if the given category exist as hook category
 * @param {string} name Hook category
 * @returns {boolean}
 */
skHook.prototype.isCategory = function (name) {
    let exist = false;
    this.getCategory().forEach((cat) => { if (name === cat) exist = true });
    return exist;
};

/**
 * Check if the given operation exist as hook operation
 * @param {string} name Hook operation
 * @returns {boolean}
 */
skHook.prototype.isOperation = function (name) {
    let exist = false;
    this.getOperation().forEach((op) => { if (name === op) exist = true });
    return exist;
};

/**
 * Set a new watcher
 * @param {string} category scene|marker|image|gallery|group|performer|studio|tag
 * @param {string} operation create|update|destroy|merge
 * @param {function} callback Callback function
 */
skHook.prototype.newWatch = function (category, operation, callback) {
    this.getWatcher(category, operation).functions.push(callback);
};

/**
 * Set a custom watcher
 * @param {string} name category.operation|category operation
 * @param {function} callback Callback function
 */
skHook.prototype.watch = function (name, callback) {
    name = name.toLowerCase();
    if (name.includes('.')) name = name.split('.');
    if (name.includes(' ')) name = name.split(' ');
    const category = name[0];
    const operation = name[1];
    if (!this.isCategory(category)) throw Error('Category not found', category);
    if (!this.isOperation(operation)) throw Error('Operation not found', operation);
    this.newWatch(category, operation, callback);
};

//BOOKMARK skTask
/**
 * The Task module
 * @constructor
 */
function skTask() {
    this.initialize.call(this);
};

/**
 * Check if the module skTask is already initializated
 * @returns {boolean}
 */
skTask.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Set empty tasks list
 */
skTask.prototype.setTasksList = function () {
    this._tasks = [];
};

/**
 * Get tasks list
 * @returns {array.<object>} Task list
 */
skTask.prototype.getTasksList = function () {
    return this._tasks;
};

/**
 * Set id for tasks setting container
 */
skTask.prototype.setTasksSetting = function () {
    this._settings = '#configuration-tabs-tabpane-tasks';
};

/**
 * Get tasks setting container
 * @returns {HTMLElement} Tasks setting container
 */
skTask.prototype.getTasksSetting = function () {
    return this._settings;
};

/**
 * Wait for the task settings page to load
 */
skTask.prototype.isTaskSettings = function () {
    sk.wait(this.getTasksSetting(), this.setTasks.bind(this));
};

/**
 * Initialize the module
 * @returns If is already initialized
 * @async
 */
skTask.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this.setTasksList();
    this.setTasksSetting();
    this.isTaskSettings();
    this._initializated = true;
};

/**
 * Check if the given task is a valid task object
 * @param {object} task Task object
 * @param {string} task.id Task id
 * @param {string} task.name Task name
 * @param {string} task.description Task description
 * @param {function} task.callback Function to run on task
 * @param {string} [task.arg] Argument to pass on function run
 * @returns {boolean}
 */
skTask.prototype.isValidTask = function (task) {
    if (!task.id || typeof task.id !== 'string') return false;
    if (!task.name || typeof task.name !== 'string') return false;
    if (!task.description || typeof task.description !== 'string') return false;
    if (!task.callback || typeof task.callback !== 'function') return false;
    return true;
};

/**
 * Create a new task
 * @param {string} id Task id
 * @param {string} name Task name
 * @param {string} description Task description
 * @param {function} callback Function to run on task
 * @param {string} [arg] Argument to pass on function run
 */
skTask.prototype.new = function (id, name, description, callback, arg) {
    const newTask = {
        id: id,
        name: name,
        description: description,
        callback: callback,
        arg: arg || ''
    };
    if (!this.isValidTask(newTask)) throw Error('Not a valid task', task);
    this.getTasksList().push(newTask);
};

/**
 * Check if custom tasks are already setted
 * @returns {boolean}
 */
skTask.prototype.isSetted = function () {
    if (document.querySelector('.skTask')) return true;
    return false;
};

/**
 * Create the plugin tasks group
 * @returns {skGraphic.contaier} Card element
 */
skTask.prototype.makeContainer = function () {
    const panelTasks = sk.ui.get('.tasks-panel-tasks');
    const hr = sk.ui.make.divider();
    const formGroup = sk.ui.make.container();
    formGroup.class('form-group', true);
    const settingSection = sk.ui.make.container();
    settingSection.class('setting-section', true);
    const title = sk.ui.make.title('Plugin Tasks');
    const card = sk.ui.make.container();
    card.class('card', true);

    panelTasks.child(hr);
    panelTasks.child(formGroup);
    formGroup.child(settingSection);
    settingSection.child(title);
    settingSection.child(card);
    return card;
};

/**
 * Get tasks container container
 * @returns {HTMLElement} Task container
 */
skTask.prototype.getContainer = function () {
    let pluginCard;
    const pluginSection = sk.ui.getAll('.form-group');
    if (pluginSection.length === 3) pluginCard = sk.ui.transform(pluginSection[2].get().firstChild.lastChild);
    if (pluginSection.length !== 3) pluginCard = this.makeContainer();
    return pluginCard;
};

/**
 * Group task by id
 * @returns {object.<array>} Grouped tasks
 */
skTask.prototype.groupTasks = function () {
    const tasksList = this.getTasksList();
    let tasksGroup = {};
    tasksList.forEach((task) => {
        if (!tasksGroup[task.id]) tasksGroup[task.id] = [];
        tasksGroup[task.id].push(task);
    });
    return tasksGroup;
};

/**
 * Create the settings group container
 * @returns {HTMLElement} Settings group container
 */
skTask.prototype.makeSettingsGroup = function () {
    const settingsGroup = sk.ui.make.container();
    settingsGroup.class('skTask setting-group collapsible', true);
    return settingsGroup;
};

/**
 * Create the settings header
 * @returns {HTMLElement} Settings header
 */
skTask.prototype.makeSettingsHeader = function (group) {
    const settingsHeader = sk.ui.make.container();
    settingsHeader.class('setting');
    const titleContainer = sk.ui.make.container();
    const title = sk.ui.make.subTitle(group);
    const buttonContainer = sk.ui.make.container();
    const button = sk.ui.make.button();
    button.class('setting-group-collapse-button btn btn-minimal');
    const arrow = sk.ui.make.svg('currentColor', 'M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z');
    arrow.class('svg-inline--fa fa-chevron-up fa-icon fa-fw');
    arrow.attribute('aria-hidden', true);
    arrow.attribute('focusable', false);
    arrow.attribute('data-prefix', 'fas');
    arrow.attribute('data-icon', 'chevron-up');
    arrow.attribute('role', 'img');
    arrow.attribute('xmlns', 'http://www.w3.org/2000/svg');
    arrow.attribute('viewBox', '0 0 512 512');

    settingsHeader.child(titleContainer);
    titleContainer.child(title);
    settingsHeader.child(buttonContainer);
    buttonContainer.child(button);
    button.child(arrow);

    button.event('click', function () { this.parentElement.parentElement.parentElement.lastChild.classList.toggle('show'); });
    return settingsHeader;
};

/**
 * Create the settings section
 * @returns {HTMLElement} Settings section
 */
skTask.prototype.makeSettingsSection = function () {
    const settingsSection = document.createElement('div');
    settingsSection.className = 'collapsible-section collapse show';
    return settingsSection;
};

/**
 * Create the setting task option
 * @returns {HTMLElement} Setting task option
 */
skTask.prototype.makeSettingsTask = function (task) {
    const settingContainer = document.createElement('div');
    settingContainer.className = 'setting';
    const settingInfo = document.createElement('div');
    const settingTitle = document.createElement('h3');
    settingTitle.innerText = task.name;
    const settingDescription = document.createElement('div');
    settingDescription.className = 'sub-heading';
    settingDescription.innerText = task.description;
    const buttonContainer = document.createElement('div');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary btn-sm';
    button.innerText = task.name;

    settingContainer.appendChild(settingInfo);
    settingInfo.appendChild(settingTitle);
    settingInfo.appendChild(settingDescription);
    settingContainer.appendChild(buttonContainer);
    buttonContainer.appendChild(button);

    button.onclick = () => { task.callback(task.arg) };
    return settingContainer;
};

/**
 * Populate task settings with custom created
 * @returns If is already setted
 */
skTask.prototype.setTasks = function () {
    if (this.isSetted()) return;
    const container = this.getContainer();
    const tasksGroup = this.groupTasks();
    for (var group in tasksGroup) {
        const settingsGroup = this.makeSettingsGroup();
        const settingsHeader = this.makeSettingsHeader(group);
        const settingsSection = this.makeSettingsSection();
        tasksGroup[group].forEach((task) => {
            const settingsTask = this.makeSettingsTask(task);
            settingsSection.appendChild(settingsTask);
        });
        container.child(settingsGroup);
        settingsGroup.child(settingsHeader);
        settingsGroup.child(settingsSection);
    };
};

//BOOKMARK skScraper
/**
 * The Scraper module
 * @constructor
 */
function skScraper() {
    this.initialize.call(this);
};

/**
 * Check if the module skScraper is already initializated
 * @returns {boolean}
 */
skScraper.prototype.isInitializated = function () {
    return this._initializated;
};

/**
 * Initialize the module
 * @returns If is already initialized
 * @async
 */
skScraper.prototype.initialize = async function () {
    if (this.isInitializated()) return;
    this._initializated = true;
};

/**
 * Scrape a given url
 * @param {string} url Url to scrape
 * @param {object} [option] Parsing option if not defined parse as text
 * @param {boolean} [option.json] If true return json data
 * @param {boolean} [option.html] if true return scraper object
 * @returns {object|string} JSON data, text or scraper object
 */
skScraper.prototype.scrape = async function (url, option) {
    const response = await sk.hook._fetch(url);
    let data;
    if (!option) return await response.text();
    if (option.json) return await response.json();
    if (option.html) {
        data = await response.text();
        return new skScraperBase(data, url);
    };
};

/**
 * Constructor of scraper object
 * @param {string} data HTML document (not parsed)
 * @param {string} url Website scraped url
 */
function skScraperBase(data, url) {
    this.initialize(data, url);
};

/**
 * Parse and set the scraped document
 * @param {string} data HTML document (not parsed)
 */
skScraperBase.prototype.setData = function (data) {
    const parser = new DOMParser();
    this._data = parser.parseFromString(data, 'text/html');
};

/**
 * Get the scraped document
 * @returns {HTMLDocument} Scraped HTML document
 */
skScraperBase.prototype.getData = function () {
    return this._data;
};

/**
 * Set the url of the scraped website
 * @param {string} url Scraped url
 */
skScraperBase.prototype.setUrl = function (url) {
    this._url = url;
};

/**
 * Get the scraped website url
 * @returns {string} Scraped url
 */
skScraperBase.prototype.getUrl = function () {
    return this._url;
};

/**
 * Initialize the scraper object
 * @param {string} data HTML document (not parsed)
 * @param {string} url Website scraped url
 */
skScraperBase.prototype.initialize = function (data, url) {
    this.setData(data);
    this.setUrl(url);
};

/**
 * Get an element inside the scraped document
 * @param {string} query Query selector
 * @returns {HTMLElement} Selected element
 */
skScraperBase.prototype.get = function (query) {
    return this.getData().querySelector(query);
};

/**
 * Get elements inside the scraped document
 * @param {string} query Query selector
 * @returns {array.<HTMLElement>} Selected elements
 */
skScraperBase.prototype.getAll = function (query) {
    return this.getData().querySelectorAll(query);
};

const sk = new ShinobiApi();