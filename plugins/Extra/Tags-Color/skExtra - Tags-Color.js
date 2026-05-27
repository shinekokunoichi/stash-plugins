(() => {
	const pluginName = 'skExtra - Tags-Color';
	let awesomplete, parentTags, tagsColor;

	async function initialize() {
		// Settings
		await setDefaultSettings();

		// Preloader
		await preloadTags();

		// Watcher
		setWatcher();

		// Compatibility
		skManagerCompatibility();
		skExtraKeybinderCompatibility();
	};

	// Settings
	async function setDefaultSettings() {
		await sk.plugin.check({
			name: pluginName,
			options: {
				colors: '',
				cardColor: true
			}
		});
	};

	// Preloader
	async function preloadTags() {
		let { colors } = sk.plugin.get(pluginName);

		parentTags = await sk.stash.find.tags({
			fieldFilter: {
				children: { modifier: 'NOT_NULL' }
			},
			fields: 'name id image_path'
		});

		tagsColor = colors ? await getGroupsColor(colors) : [];
	};

	async function getGroupsColor(colors) {
		colors = colors.split(',').map((data) => {
			let [name, color] = data.split(':');
			if (name[0] === '|') name = name.slice(1);
			return {
				name: name,
				color: color
			};
		});

		for (let i = 0; i < colors.length; i++) {
			const { name, color } = colors[i];
			let find;
			for (const parentTag of parentTags) {
				if (!find && name === parentTag.name) {
					colors[i].subTags = await sk.stash.find.tags({
						fieldFilter: {
							parents: {
								value: [parentTag.id],
								modifier: 'INCLUDES_ALL',
								depth: -1
							}
						},
						fields: 'name'
					}) || [];
					find = true;
				};
			};
		};

		return colors;
	};

	// Watcher
	function setWatcher() {
		sk.tool.wait('.tag-item', () => setTagItemColor(true));
		sk.tool.wait('.skExtra_Easy_Tagger_TagSelector', setTagItemColor);

		if (sk.plugin.get(pluginName).cardColor) sk.tool.wait(sk.ui.is.tagCard, setCardColor);
	};

	function setTagItemColor(popUps) {
		if (popUps) sk.ui.get.cards.tagsPopUps().forEach((tag) => {
			const tagName = tag.read().includes('|') ? tag.read().slice(0, -1) : tag.read();
			const tagColor = getTagColor(tagName);
			if (tagColor) tag.style({ 'background-color': tagColor });
		});

		if (!popUps) sk.tool.getAll('.skExtra_Easy_Tagger_TagSelector').forEach(tag => {
			const tagColor = getTagColor(tag.read());
			if (tagColor) tag.style({ 'background-color': tagColor });
		});
	};

	function getTagColor(tagName) {
		let find;

		tagsColor.forEach((parentTag) => {
			if (!find) {
				if (tagName === parentTag.name) find = parentTag.color;
				if (tagName !== parentTag.name) parentTag.subTags.forEach(subTag => tagName === subTag.name ? find = parentTag.color : null);
			};
		});

		return find;
	};

	function setCardColor() {
		sk.ui.get.cards.tag().forEach((tag) => {
			const tagName = tag._data.name;
			const tagColor = getTagColor(tagName);
			if (tagColor) tag.style({ 'background-color': parentTag.color });
		});
	};

	// Compatibility
	function skManagerCompatibility() {
		if (window._skManager) window._skManager.load({
			name: pluginName,
			callback: colorChangerGUI,
			updates: [
				{
					version: '1.0',
					description: 'Plugin created.'
				},
				{
					version: '2.0',
					description: 'Added compatibility to skManager.'
				},
				{
					version: '2.1',
					description: 'Force update plugin.'
				},
				{
					version: '2.1.1',
					description: "Fixed error when there aren't any colors declared."
				},
				{
					version: '2.1.2',
					description: 'Fixed error not showing the first declared color.\nAdded compatibility to future plugins.'
				}
			]
		});
	};

	function colorChangerGUI() {
		const gui = sk.ui.make.popUp({
			id: 'skExtra_Tags_Color_GUI',
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

		gui.append(currentColorsSection(), addNewColorSection());

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

	function currentColorsSection() {
		const section = sk.ui.make.container();
		const title = sk.ui.make.title({ text: 'Current colors' });
		section.append(title);

		const colorsList = sk.ui.make.container({
			flex: true,
			style: { 'flex-wrap': 'wrap' }
		});

		tagsColor.forEach((colorData, i) => {
			const subTagsList = colorData.subTags.map(subTag => `${subTag.name}`).join(', ');

			const card = sk.ui.make.container({
				class: 'card',
				style: {
					cursor: 'pointer',
					'background-color': colorData.color
				},
				event: {
					type: 'click',
					callback: () => colorPicker.click()
				}
			});
			const name = sk.ui.make.subTitle({ text: colorData.name });
			const description = sk.ui.make.description({
				text: `Applied to ${colorData.subTags.length + 1} tags`,
				attribute: { title: subTagsList }
			});
			const colorPicker = sk.ui.make.input({
				style: { display: 'none' },
				attribute: { type: 'color' },
				event: [
					{
						type: 'input',
						callback: () => card.style({ 'background-color': colorPicker.value() })
					},
					{
						type: 'change',
						callback: () => changeColor(card, i, colorData, colorPicker.value())
					}
				]
			});
			const remove = sk.ui.make.button({
				text: 'Remove',
				class: 'btn btn-secondary',
				event: {
					type: 'click',
					callback: () => removeColor(card, i, colorData)
				}
			});

			card.append(name, description, colorPicker, remove);
			colorsList.append(card);
		});

		section.append(colorsList);
		return section;
	};

	function changeColor(card, index, colorData, newColor) {
		const newColorData = `${colorData.name}:${newColor}`;
		const { colors } = sk.plugin.get(pluginName);
		const newData = colors.replace(`${colorData.name}:${colorData.color}`, newColorData);

		sk.plugin.update({
			name: pluginName,
			options: { colors: newData }
		});

		tagsColor[index].color = newColor;
	};

	function removeColor(card, index, colorData) {
		const toRemove = `${colorData.name}:${colorData.color}`;
		const { colors } = sk.plugin.get(pluginName);
		let newData = colors.replace(toRemove, '');
		if (newData.includes('||')) newData = newData.replace('||', '|');

		sk.plugin.update({
			name: pluginName,
			options: { colors: newData }
		});

		tagsColor.slice(index, 1);
		card.remove();
	};

	function addNewColorSection() {
		const section = sk.ui.make.container({
			style: {
				width: '100%',
				'aling-items': 'flex-start'
			}
		});
		const title = sk.ui.make.title({ text: 'Add color' });
		const inputSection = sk.ui.make.container({ flex: true });
		section.append(title, inputSection);

		const tagSection = sk.ui.make.container({ style: { width: '50%' } });
		tagSection.append(createAwesompleteInput());

		const colorSection = sk.ui.make.container({ style: { width: '25%' } });
		const titleColor = sk.ui.make.subTitle({ text: 'Color' });
		const colorPicker = sk.ui.make.input({
			style: { display: 'none' },
			attribute: { type: 'color' },
			event: {
				type: 'input',
				callback: () => colorSection.style({ 'background-color': colorPicker.value() })
			}
		});
		const chooseColor = sk.ui.make.button({
			text: 'Choose',
			class: 'btn btn-secondary',
			event: {
				type: 'click',
				callback: () => colorPicker.click()
			}
		});
		colorSection.append(titleColor, colorPicker, chooseColor);

		inputSection.append(tagSection, colorSection);

		const save = sk.ui.make.button({
			class: 'btn btn-success',
			text: 'Add',
			event: {
				type: 'click',
				callback: () => addNewColor(colorPicker, inputSection)
			}
		});
		section.append(save);
		return section;
	};

	function createAwesompleteInput(category) {
		const group = sk.ui.make.container({
			class: 'autocomplete-container',
			style: {
				width: '50%',
				'text-align': 'center'
			}
		});
		const label = sk.ui.make.subTitle({
			text: 'Tag to color',
			style: { 'text-align': 'center' },
			attribute: { for: 'tags-autocomplete' }
		});
		const input = sk.ui.make.input({
			id: 'tags-autocomplete',
			class: 'form-control awesomplete',
			attribute: { 'data-list': '' },
			event: {
				type: 'click',
				callback: () => filterResults(input.element)
			}
		});
		group.append(label, input);

		awesomplete = new Awesomplete(input.element, {
			minChars: 1,
			maxItems: 10,
			item: (suggestion, input) => {
				const [name, image_path] = suggestion.split('|');
				const li = document.createElement('li');
				const img = document.createElement('img');
				img.src = image_path.trim();
				const div = document.createElement('div');
				div.textContent = name.trim();
				li.appendChild(img);
				li.appendChild(div);
				return li;
			},
			replace: (suggestion) => {
				const [name] = suggestion.split('|');
				input.value(name.trim());
			}
		});

		return group;
	};

	function filterResults(input) {
		let tempList = parentTags.map(tag => tag.name.toLowerCase().includes(input.value.toLowerCase()) ? `${tag.name}|${tag.image_path}` : null);
		awesomplete.list = tempList.filter(tag => tag);
	};

	async function addNewColor(color, tag) {
		color = color.value();
		tag = tag.child()[0].child()[0].child()[1].child()[0].value();

		const newColor = `|${tag}:${color}`;
		let { colors } = sk.plugin.get(pluginName);
		colors += newColor;

		sk.plugin.update({
			name: pluginName,
			options: { colors: colors }
		});

		await preloadTags();
		sk.tool.get('#skExtra_Tags_Color_GUI').remove();
		colorChangerGUI();
	};

	function skExtraKeybinderCompatibility() {
		if (window._skExtra_Keybinder) window._skExtra_Keybinder.load({
			[pluginName]: [
				{
					sequence: 's k t c g',
					action: 'Open the color changer GUI',
					callback: () => colorChangerGUI()
				},
				{
					sequence: 'esc',
					action: 'Close the color changer GUI',
					callback: () => sk.tool.get('#skExtra_Tags_Color_GUI').remove(),
					selector: '#skExtra_Tags_Color_GUI'
				}
			]
		});
	};

	initialize();
})()