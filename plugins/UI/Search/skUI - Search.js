(() => {
    async function main() {
        if (sk.tool.get('#skAlphabetFilter')) return;
        const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
        const container = sk.ui.make.container({ id: 'skAlphabetFilter', class: 'btn-group', flex: true, style: { padding: '2vh 0' } });
        alphabet.forEach((char) => {
            let active = '';
            if (sessionStorage.getItem('skAlphabetFilter') === char) active = ' active';
            const button = sk.ui.make.button({ text: char, class: `btn-secondary${active}`, style: { border: 'none', padding: '1vh 1vw' } });
            button.event({
                type: 'click', callback: () => {
                    sk.tool.get('.filter-button').element.click();
                    const filterName = sk.tool.get("div[data-type='name']");
                    filterName.get('button').element.click();
                    const input = filterName.get('input');
                    const apply = sk.tool.get('.modal-footer').element.lastChild.lastChild;
                    let matchRegex;
                    filterName.getAll('.modifier-options button').forEach((btn) => { if (btn.read() === 'matches regex') matchRegex = btn });
                    matchRegex.element.click();
                    const alreadySetted = filterName.get('.remove-criterion-button');
                    if (alreadySetted) {
                        sk.tool.get('#skAlphabetFilter .active').class('active');
                        alreadySetted.element.click();
                        apply.click();
                    };
                    if (!alreadySetted) {
                        input.attribute({ value: `^[${char}${char.toUpperCase()}]` });
                        input.element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
                        apply.click();
                        button.class('active');
                        sessionStorage.setItem('skAlphabetFilter', char);
                    };
                }
            });
            container.append(button);
        });
        const filterBar = sk.tool.get('.filtered-list-toolbar').element;
        filterBar.parentNode.insertBefore(container.element, filterBar.nextSibling);
    };

    sk.tool.wait('.filtered-list-toolbar', main);
})();