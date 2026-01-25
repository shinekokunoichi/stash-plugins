(async function () {
    let settings = sk.plugins.get('skUI - Tags');
    const defaultSettings = {
        colors: ''
    };

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
                    options[i].sort_name = group.sort_name;
                    find = true;
                };
            });
        });
        return options;
    };

    function applyColor(tag, colors) {
        if (!tag.attribute('data-sort-name')) return;
        let find = false;
        let name = tag.get().firstChild.firstChild.innerText.toLowerCase();
        colors.forEach((color) => {
            if (find) return;
            if (name === color.category.toLowerCase()) {
                tag.css('background', color.color);
                find = true;
            };
            color.group.forEach((subTag) => {
                if (name === subTag.name.toLowerCase()) {
                    tag.css('background', color.color);
                    find = true;
                };
            });
        });
    };

    function colorize(colors) {
        const tags = sk.ui.getAll('.tag-item');
        if (!tags[0]) return;
        tags.forEach((tag) => { applyColor(tag, colors) });
    };

    async function firstRun() {
        if (!settings) settings = defaultSettings;
        const tagsGroup = await sk.stash.findTags('', { fieldFilter: { children: { modifier: 'NOT_NULL' } } });
        const colors = await userColors(tagsGroup);
        for (let i = 0; i < colors.length; i++) {
            const group = await sk.stash.findTags('', { fieldFilter: { parents: { value: [colors[i].id], modifier: 'INCLUDES_ALL', depth: -1 } } });
            colors[i].group = group;
        };
        sessionStorage.setItem('skUI-Tags', JSON.stringify(colors));
        colorize(colors);
    };

    async function main() {
        const colors = JSON.parse(sessionStorage.getItem('skUI-Tags'));
        if (colors) colorize(colors);
        firstRun();
    };

    sk.wait('.tag-item', main);
})();