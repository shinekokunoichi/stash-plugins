(() => {
    const pluginName = 'skExtra - Keybinder';
    const Mousetrap = PluginApi.libraries.Mousetrap;
    const skCombo = 'left down right left down right s k';
    let newComboWatching, comboWatching;
    let allKeybinding = {};

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Global handler
        setGlobalHandler();

        // Keybinder
        handleUserInput();

        // Tasks
        setTasks();

        // Compatibility
        skManagerCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: { keybinder: JSON.stringify(getDefaultKeybinding()) }
        });
    };

    function getDefaultKeybinding() {
        return {
            Global: [
                {
                    sequence: '?',
                    action: 'Display manual'
                },
                {
                    sequence: 'g s',
                    action: 'Open scenes page'
                },
                {
                    sequence: 'g i',
                    action: 'Open images page'
                },
                {
                    sequence: 'g v',
                    action: 'Open groups page'
                },
                {
                    sequence: 'g k',
                    action: 'Open markers page'
                },
                {
                    sequence: 'g l',
                    action: 'Open galleries page'
                },
                {
                    sequence: 'g p',
                    action: 'Open performers page'
                },
                {
                    sequence: 'g u',
                    action: 'Open studios page'
                },
                {
                    sequence: 'g t',
                    action: 'Open tags page'
                },
                {
                    sequence: 'g z',
                    action: 'Open settings page'
                }
            ],
            Query: [
                {
                    sequence: '/',
                    action: 'Focus search field / focus query field in filter dialog'
                },
                {
                    sequence: 'f',
                    action: 'Show add filter dialog'
                },
                {
                    sequence: 'r',
                    action: 'Reshuffle if sorted by random'
                },
                {
                    sequence: 'v g',
                    action: 'Set view to grid'
                },
                {
                    sequence: 'v l',
                    action: 'Set view to list'
                },
                {
                    sequence: 'v w',
                    action: 'Set view to wall'
                },
                {
                    sequence: 'v t',
                    action: 'Set view to tagger'
                },
                {
                    sequence: '+',
                    action: 'Increase zoom slider'
                },
                {
                    sequence: '-',
                    action: 'Decrese zoom slider'
                },
                {
                    sequence: '←',
                    action: 'Previous page of results'
                },
                {
                    sequence: '→',
                    action: 'Next page of results'
                },
                {
                    sequence: 'Shift + ←',
                    action: 'Go to current results page -10'
                },
                {
                    sequence: 'Shift + →',
                    action: 'Go to curret results page +10'
                },
                {
                    sequence: 'Ctrl + Home',
                    action: 'Go to first page of results'
                },
                {
                    sequence: 'Ctrl + End',
                    action: 'Go to last page of results'
                },
                {
                    sequence: 's a',
                    action: 'Select all on page'
                },
                {
                    sequence: 's n',
                    action: 'Unselect all'
                },
                {
                    sequence: 's i',
                    action: 'Invert selection'
                },
                {
                    sequence: 'e',
                    action: 'Edit selected'
                },
                {
                    sequence: 'd d',
                    action: 'Delete selected'
                }
            ],
            'Scene page': [
                {
                    sequence: 'a',
                    action: 'Details tab'
                },
                {
                    sequence: 'q',
                    action: 'Queue tab'
                },
                {
                    sequence: 'k',
                    action: 'Markers tab'
                },
                {
                    sequence: 'i',
                    action: 'File info tab'
                },
                {
                    sequence: 'e',
                    action: 'Edit tab'
                },
                {
                    sequence: 'h',
                    action: 'History tab'
                },
                {
                    sequence: ',',
                    action: 'Hide/Show sidebar'
                },
                {
                    sequence: '.',
                    action: 'Hide/Show scene scrubber'
                },
                {
                    sequence: 'o',
                    action: 'Increment O-Counter'
                },
                {
                    sequence: 'd d',
                    action: 'Delete scene'
                },
                {
                    sequence: 'r {1-5}',
                    action: 'Set rating (stars)'
                },
                {
                    sequence: 'r 0',
                    action: 'Unset rating (stars)'
                },
                {
                    sequence: 'r {0-9} {0-9}',
                    action: 'Set rating (decimal - 00 for 10.0)'
                },
                {
                    sequence: 'r `',
                    action: 'Unset rating (decimal)'
                },
                {
                    sequence: 'c c',
                    action: 'Generate screenshot at current time'
                },
                {
                    sequence: 'c d',
                    action: 'Generate default screenshot'
                },
                {
                    sequence: 'p n',
                    action: 'Play next scene in queue'
                },
                {
                    sequence: 'p p',
                    action: 'Play previous scene in queue'
                },
                {
                    sequence: 'p r',
                    action: 'Play random scene in queue'
                },
                {
                    sequence: 'Space',
                    action: 'Play/Pause player'
                },
                {
                    sequence: 'Enter',
                    action: 'Play/Pause player'
                },
                {
                    sequence: '←',
                    action: 'Seek backward by 10 seconds'
                },
                {
                    sequence: '→',
                    action: 'Seek forwards by 10 seconds'
                },
                {
                    sequence: 'Shift + ←',
                    action: 'Seek backward by 5 seconds'
                },
                {
                    sequence: 'Shift + →',
                    action: 'Seek forwards by 5 seconds'
                },
                {
                    sequence: 'Ctrl/Alt + ←',
                    action: 'Seek backwards by 1 second'
                },
                {
                    sequence: 'Ctrl/Alt + →',
                    action: 'Seek forwards by 1 seconds'
                },
                {
                    sequence: '{1-9}',
                    action: 'Seek to 10-90% duration'
                },
                {
                    sequence: '[',
                    action: 'Scrub backwards 10% duration'
                },
                {
                    sequence: ']',
                    action: 'Scrub forwards 10% duration'
                },
                {
                    sequence: '↑',
                    action: 'Increase volume 10%'
                },
                {
                    sequence: '↓',
                    action: 'Decrease volume 10%'
                },
                {
                    sequence: 'm',
                    action: 'Toggle mute'
                },
                {
                    sequence: 'l',
                    action: 'A/B looping toggle. Press once to set start point. Press again to set end point. Press again to disable loop.'
                },
                {
                    sequence: 'Shift + l',
                    action: "Toggle looping of scene when it's over"
                }
            ],
            'Scene markers tab': [
                {
                    sequence: 'n',
                    action: 'Display create markers dialog'
                }
            ],
            'Scene edit tab': [
                {
                    sequence: 's s',
                    action: 'Save scene'
                },
                {
                    sequence: 'd d',
                    action: 'Delete scene'
                },
                {
                    sequence: 'Ctrl + v',
                    action: 'Paste scene cover'
                }
            ],
            'Image page': [
                {
                    sequence: 'e',
                    action: 'Edit tab'
                },
                {
                    sequence: 'o',
                    action: 'Increment O-Counter'
                },
                {
                    sequence: 'r {1-5}',
                    action: 'Set rating (stars)'
                },
                {
                    sequence: 'r 0',
                    action: 'Unset rating (stars)'
                },
                {
                    sequence: 'r {0-9} {0-9}',
                    action: 'Set rating (decimal - 00 for 10.0)'
                },
                {
                    sequence: 'r `',
                    action: 'Unset rating (decimal)'
                }
            ],
            'Image edit tab': [
                {
                    sequence: 's s',
                    action: 'Save image'
                },
                {
                    sequence: 'd d',
                    action: 'Delete image'
                }
            ],
            'Groups page': [
                {
                    sequence: 'n',
                    action: 'New group'
                }
            ],
            'Group page': [
                {
                    sequence: 'e',
                    action: 'Edit group'
                },
                {
                    sequence: 's s',
                    action: 'Save group'
                },
                {
                    sequence: 'd d',
                    action: 'Delete group'
                },
                {
                    sequence: ',',
                    action: 'Expand/Collapse details'
                },
                {
                    sequence: 'Ctrl + v',
                    action: 'Paste group page'
                },
                {
                    sequence: 'r {1-5}',
                    action: 'Set rating (stars)'
                },
                {
                    sequence: 'r 0',
                    action: 'Unset rating (stars)'
                },
                {
                    sequence: 'r {0-9} {0-9}',
                    action: 'Set rating (decimal - 00 for 10.0)'
                },
                {
                    sequence: 'r `',
                    action: 'Unset rating (decimal)'
                }
            ],
            'Markers page': [
                {
                    sequence: 'p r',
                    action: 'Play random marker'
                }
            ],
            'Performers page': [
                {
                    sequence: 'n',
                    action: 'New performer'
                },
                {
                    sequence: 'p r',
                    action: 'Open random performer'
                }
            ],
            'Performer page': [
                {
                    sequence: 'c',
                    action: 'Scenes tab'
                },
                {
                    sequence: 'e',
                    action: 'Edit tab'
                },
                {
                    sequence: 'o',
                    action: 'Operations tab'
                },
                {
                    sequence: 'f',
                    action: 'Toggle favourite'
                },
                {
                    sequence: ',',
                    action: 'Expand/Collapse details'
                }
            ],
            'Performer edit tab': [
                {
                    sequence: 's s',
                    action: 'Save performer'
                },
                {
                    sequence: 'd d',
                    action: 'Delete performer'
                },
                {
                    sequence: 'Ctrl + v',
                    action: 'Paste performer image'
                }
            ],
            'Studios page': [
                {
                    sequence: 'n',
                    action: 'New studio'
                }
            ],
            'Studio page': [
                {
                    sequence: 'e',
                    action: 'Edit studio'
                },
                {
                    sequence: 's s',
                    action: 'Save studio'
                },
                {
                    sequence: 'd d',
                    action: 'Delete studio'
                },
                {
                    sequence: ',',
                    action: 'Expand/Collapse details'
                },
                {
                    sequence: 'Ctrl + v',
                    action: 'Paste studio image'
                }
            ],
            'Tags page': [
                {
                    sequence: 'n',
                    action: 'New tag'
                }
            ],
            'Tag page': [
                {
                    sequence: 'e',
                    action: 'Edit tag'
                },
                {
                    sequence: 's s',
                    action: 'Save tag'
                },
                {
                    sequence: 'd d',
                    action: 'Delete tag'
                },
                {
                    sequence: ',',
                    action: 'Expand/Collapse details'
                },
                {
                    sequence: 'Ctrl + v',
                    action: 'Paste tag image'
                }
            ],
            [pluginName]: [
                {
                    sequence: 's k k g',
                    action: 'Open the keybinder GUI',
                    callback: () => sk.tool.get('#skExtra_Keybinder_Navbar').click()
                },
                {
                    sequence: 'esc',
                    action: 'Close the keybinder GUI',
                    callback: () => sk.tool.get('#skExtra_Keybinder_GUI').remove(),
                    selector: '#skExtra_Keybinder_GUI'
                }
            ]
        };
    };

    // Global Handler
    function setGlobalHandler() {
        window._skExtra_Keybinder = {
            keybinding: undefined,
            load: (keybind) => addCustomKeybind(keybind)
        };

        window._skExtra_Keybinder.load(getDefaultKeybinding());
    };

    function addCustomKeybind(defaultKeybinding) {
        const userKeybinding = JSON.parse(sk.plugin.get(pluginName).keybinder) || defaultKeybinding;

        for (const where in defaultKeybinding) {
            allKeybinding[where] = [];

            for (let i = 0; i < defaultKeybinding[where].length; i++) {
                const defaultKeybind = defaultKeybinding[where][i];
                const userKeybind = userKeybinding[where] && userKeybinding[where][i] ? userKeybinding[where][i] : defaultKeybind;
                allKeybinding[where].push(userKeybind);

                const trigger = () => translateCustomKeybind(defaultKeybind.sequence, defaultKeybind.selector, defaultKeybind.callback);

                Mousetrap.bind(`${skCombo} ${userKeybind.sequence}`, () => trigger());
            };
        };
        window._skExtra_Keybinder.keybinding = allKeybinding;
    };

    function translateCustomKeybind(defaultKeybind, selector, callback) {
        if (selector && document.activeElement !== sk.tool.get(selector).element) return;
        if (!selector && document.activeElement) return;
        if (callback) callback();
        if (!callback) {
            Mousetrap.unpause();
            Mousetrap.trigger(defaultKeybind);
            Mousetrap.pause();
        };
    };

    // Keybinder
    function handleUserInput() {
        document.addEventListener('keyup', (event) => {
            const keyCombination = keyPressTranslator(event);
            comboWatching = comboWatching ? `${comboWatching} ${keyCombination}` : keyCombination;

            Mousetrap.trigger(`${skCombo} ${comboWatching}`);

            setTimeout(() => comboWatching = undefined, 1000);
        });
    };

    function keyPressTranslator(event) {
        let { ctrlKey, shiftKey, key, keyCode } = event;
        if (key === 'Control' || key === 'Shift') return;

        let keyCombination = '';
        const validShift = keyCode >= 65 && keyCode <= 90;
        if (ctrlKey) keyCombination += 'Mod+';
        if (shiftKey && validShift) keyCombination += 'Shift+';
        if (key.includes('arrow')) {
            if (key === 'ArrowRight') key = '→';
            if (key === 'ArrowLeft') key = '←';
            if (key === 'ArrowUp') key = '↑';
            if (key === 'ArrowDown') key = '↓';

        } else keyCombination += key.toLowerCase();

        return keyCombination;
    };

    function keybinderGUI() {
        const gui = sk.ui.make.popUp({
            id: 'skExtra_Keybinder_GUI',
            class: 'bg-dark',
            style: {
                width: '50%',
                height: '100%',
                top: 0,
                right: 0,
                'box-shadow': '0 0 5px black',
                'overflow-y': 'auto'
            }
        });

        for (const where in window._skExtra_Keybinder.keybinding) {
            const section = sk.ui.make.container({
                flex: true,
                style: {
                    cursor: 'pointer',
                    'flex-direction': 'column',
                    'margin-top': '1rem'
                },
                event: {
                    type: 'click',
                    callback: () => section.child()[1].style({ display: section.child()[1].style('display') === 'flex' ? 'none' : 'flex' })
                }
            });
            const title = sk.ui.make.title({ text: where });
            const keybindSection = sk.ui.make.container({
                flex: true,
                style: { 'flex-wrap': 'wrap' }
            });

            for (const keybind of window._skExtra_Keybinder.keybinding[where]) keybindSection.append(createKeybindCard(where, keybind));

            section.append(title, keybindSection);
            section.click();
            gui.append(section);
        };

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

    function createKeybindCard(where, keybind) {
        const { sequence, action } = keybind;

        const card = sk.ui.make.container({
            class: 'card',
            event: {
                type: 'click',
                callback: () => editKeybindDialog(where, sequence)
            }
        });
        const currentBinding = sk.ui.make.subTitle({ text: sequence });
        const description = sk.ui.make.description({ text: action });

        card.append(currentBinding, description);
        return card;
    };

    function editKeybindDialog(where, sequence) {
        const dialog = sk.ui.make.popUp({
            flex: true,
            id: 'skExtra_Keybinder_Dialog',
            class: 'card',
            style: {
                width: '50%',
                height: '25%',
                top: '37.5%',
                left: '25%',
                'flex-direction': 'column'
            }
        });
        const help = sk.ui.make.title({
            text: 'Waiting for key pressed...',
            id: 'skExtra_Keybinder_Help'
        });

        const buttonSection = sk.ui.make.container({
            flex: true,
            style: {
                'margin-top': '1rem',
                gap: '1rem'
            }
        });
        const saveKeybind = sk.ui.make.button({
            text: 'Save',
            class: 'btn btn-success',
            event: {
                type: 'click',
                callback: () => saveNewKeybind(where, sequence)
            }
        });
        const resetKeybind = sk.ui.make.button({
            text: 'Reset',
            class: 'btn btn-primary',
            event: {
                type: 'click',
                callback: resetNewKeybind
            }
        });
        const closeKeybind = sk.ui.make.button({
            text: 'Close',
            class: 'btn btn-danger',
            event: {
                type: 'click',
                callback: closeKeybindDialog
            }
        });
        buttonSection.append(saveKeybind, resetKeybind, closeKeybind);

        document.addEventListener('keyup', registerKeybind);

        dialog.append(help, buttonSection);
        document.body.append(dialog.element);
    };

    async function saveNewKeybind(where, sequence) {
        let oldCombo;
        let index;

        const newKeybinds = window._skExtra_Keybinder.keybinding[where].map((e, i) => {
            if (e.sequence === sequence) {
                index = i;
                oldCombo = e.sequence;
                return { sequence: newComboWatching, action: e.action }
            };
            return e;
        });

        window._skExtra_Keybinder.keybinding[where] = newKeybinds;

        sk.tool.get('#skExtra_Keybinder_GUI').remove();
        keybinderGUI();
        closeKeybindDialog();

        await sk.plugin.update({
            name: pluginName,
            options: { keybinder: JSON.stringify(window._skExtra_Keybinder.keybinding) }
        });

        Mousetrap.unbind(`${skCombo} ${oldCombo}`);
        Mousetrap.bind(`${skCombo} ${newComboWatching}`, () => Mousetrap.trigger(window._skExtra_Keybinder.keybinding[where][i]));
    };

    function resetNewKeybind() {
        newComboWatching = undefined;
        sk.tool.get('#skExtra_Keybinder_Help').write('Waiting for key pressed...');
    };

    function closeKeybindDialog() {
        newComboWatching = undefined;
        sk.tool.get('#skExtra_Keybinder_Dialog').remove();
        document.removeEventListener('keyup', registerKeybind);
    };

    function registerKeybind(event) {
        const keyCombination = keyPressTranslator(event);
        newComboWatching = newComboWatching ? `${newComboWatching} ${keyCombination}` : keyCombination;

        sk.tool.get('#skExtra_Keybinder_Help').write(newComboWatching);
    };

    // Tasks
    function setTasks() {
        sk.task.add({
            id: pluginName,
            name: 'GUI',
            description: 'Open keybinder editor GUI.',
            callback: keybinderGUI
        });
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            callback: keybinderGUI,
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