(() => {
    const pluginName = 'skExtra - Keybinder';

    async function initialize() {
        // Global handler
        setGlobalHandler();

        // Watcher
        setWatcher();

        // Compatibility
        skExtraKeybinderCompatibility();
    };

    // Global handler
    function setGlobalHandler() {
        window._skManager = {
            plugins: [],
            load: plugin => {window._skManager.plugins.push(plugin)}
        };
    };

    // Watcher
    function setWatcher() {
        sk.tool.wait('.navbar-buttons', navbarManagerButton, true);
    };

    function navbarManagerButton() {
        if (sk.tool.get('#skManager_Navbar')) return;

        sk.ui.get.navbar().buttons.append(sk.ui.make.image({
            id: 'skManager_Navbar',
            url: '/plugin/skUI - Assets/assets/Core/skManager.png',
            style: {
                height: '3rem',
                cursor: 'pointer'
            },
            event: {
                type: 'click',
                callback: managerGUI
            }
        }));
    };

    function managerGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skManager_GUI',
            class: 'bg-dark',
            flex: true,
            style: {
                width: '50%',
                height: '100%',
                top: 0,
                right: 0,
                'justify-content': 'space-between',
                'flex-direction': 'column',
                'box-shadow': '0 0 5px black',
                'overflow-y': 'auto'
            }
        });
        const navigation = sk.ui.make.container({
            flex: true,
            style: { gap: '1rem' }
        });
        ['Manager', 'Updates'].forEach((category, index) => navigation.append(sk.ui.make.button({
            text: category,
            class: 'btn btn-secondary',
            event: {
                type: 'click',
                callback: () => mainContent.child().forEach((section, i) => section.style('display') !== 'block' && index === i ? section.style({ display: 'block' }) : section.style({ display: 'none' }))
            }
        })));

        const mainContent = sk.ui.make.container({ style: { width: '100%' } });
        mainContent.append(addManagerSection(), addUpdateSection());

        const close = sk.ui.make.button({
            text: 'Close',
            class: 'btn btn-danger',
            event: {
                type: 'click',
                callback: () => gui.remove()
            }
        });

        navigation.child()[0].click();
        gui.append(navigation, mainContent, close);
        document.body.append(gui.element);
    };

    function addManagerSection() {
        const section = sk.ui.make.container({ style: { width: '100%' } });

        let categories = [];
        window._skManager.plugins.toSorted((a, b) => a.name.localeCompare(b.key))
        window._skManager.plugins.forEach(plugin => {
            if (!plugin.callback) return;

            const category = plugin.name.split(' - ')[0];

            if (!categories.includes(category)) {
                categories.push(category);

                const categorySection = sk.ui.make.container();

                const title = sk.ui.make.title({ text: category });
                const pluginsCards = sk.ui.make.container({
                    flex: true,
                    style: { 'flex-wrap': 'wrap' }
                });

                categorySection.append(title, pluginsCards);
                section.append(categorySection);
            };

            const card = createPluginCard(plugin);
            if (card) section.child()[categories.indexOf(category)].element.children[1].append(card.element);
        });

        return section;
    };

    function createPluginCard(plugin) {
        const card = sk.ui.make.container({
            class: 'card',
            flex: true,
            style: {
                cursor: 'pointer',
                width: '15rem',
                height: '15rem',
                padding: 0,
                'background-image': `url("/plugin/skUI - Assets/assets/Core/${plugin.name}.png")`,
                'background-size': '20rem',
                'background-position': 'top',
                'justify-content': 'flex-start',
                'border-radious': '2rem'
            },
            event: {
                type: 'click',
                callback: plugin.callback
            }
        });
        const title = sk.ui.make.subTitle({
            text: plugin.name.split(' - ')[1].replace('-', ' '),
            style: { 'text-shadow': '0 0 1rem black' }
        });

        card.append(title);
        return card;
    };

    function addUpdateSection() {
        const section = sk.ui.make.container({ style: { width: '100%' } });

        window._skManager.plugins.toSorted((a, b) => a.name.localeCompare(b.key))
        window._skManager.plugins.forEach(plugin => {
            if (!plugin.updates) return;

            const pluginContainer = sk.ui.make.container({
                class: 'card',
                flex: true,
                style: { 'flex-direction': 'column' }
            });
            const updateSection = sk.ui.make.container({
                flex: true,
                style: { 'flex-wrap': 'wrap' }
            })
            const pluginCard = createPluginCard(plugin);
            pluginContainer.append(pluginCard, updateSection);

            plugin.updates.forEach((update) => {
                const card = sk.ui.make.container({ class: 'card' });
                const title = sk.ui.make.subTitle({ text: update.version });
                const description = sk.ui.make.description({ text: update.description });

                card.append(title, description);
                updateSection.append(card);
            });

            section.append(pluginContainer);
        });

        return section;
    };

    // Compatibility
    function skExtraKeybinderCompatibility() {
        if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
            [pluginName]: [
                {
                    sequence: 's k m g',
                    action: 'Open the manager GUI',
                    callback: () => parseGUI()
                },
                {
                    sequence: 'esc',
                    action: 'Close the manager GUI',
                    callback: () => sk.tool.get('#skManager_GUI').remove(),
                    selector: '#skManager_GUI'
                }
            ]
        });
    };

    initialize();
})()