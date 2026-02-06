(() => {
    const pluginName = 'skUI - Tags';
    let settings;

    function userColors(tagsGroup) {
        const colors = settings.colors.split(',');
        let options = [];
        colors.forEach((color) => {
            const data = color.split(':');
            options.push({ category: data[0], color: data[1] });
        });
        if (!options[0]) return;
        let find;
        options.forEach((option, i) => {
            find = false;
            tagsGroup.forEach((group) => {
                if (find) return;
                if (option.category.toLowerCase() === group.name.toLowerCase()) {
                    options[i].id = group.id;
                    find = true;
                };
            });
        });
        return options;
    };

    function applyColor(tag, colors) {
        if (!tag.attribute('data-sort-name')) return;
        let find = false;
        let name = tag.element.firstChild.firstChild.innerText.toLowerCase();
        colors.forEach((color) => {
            if (find) return;
            if (name === color.category.toLowerCase()) {
                tag.css({ 'background-color': color.color });
                find = true;
            };
            color.group.forEach((subTag) => {
                if (name === subTag.name.toLowerCase()) {
                    tag.style({'background-color': color.color});
                    find = true;
                };
            });
        });
    };

    function colorize(colors) {
        const tags = sk.ui.get.tagsPopUps();
        if (!tags[0]) return;
        tags.forEach((tag) => { applyColor(tag, colors) });
    };

    async function firstRun() {
        if (settings.colors === '') return;
        const tagsGroup = await sk.stash.find.tags({ fieldFilter: { children: { modifier: 'NOT_NULL' } }, fields: 'name id' });
        const colors = await userColors(tagsGroup);
        for (let i = 0; i < colors.length; i++) {
            const group = await sk.stash.find.tags({ fieldFilter: { parents: { value: [colors[i].id], modifier: 'INCLUDES_ALL', depth: -1 } }, fields:'name' });
            colors[i].group = group;
        };
        sessionStorage.setItem('skUI-Tags', JSON.stringify(colors));
        colorize(colors);
    };

    async function main() {
        const colors = JSON.parse(sessionStorage.getItem('skUI-Tags'));
        if (!colors) {
            const defaultSettings = {
                name: pluginName,
                options: {
                    colors: ''
                }
            };
            await sk.plugin.check(defaultSettings);
            settings = sk.plugin.get(pluginName);
            await firstRun();
        };
        if (colors) colorize(colors);
    };

    sk.tool.wait('.tag-item', main);
})();