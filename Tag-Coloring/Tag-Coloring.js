(async () => {

	const server = 'http://localhost:9999/graphql';
	const key = '';
	const option = window.__APOLLO_CLIENT__.cache.data.data.ROOT_QUERY.configuration.plugins['Tag-Coloring'].Colors;
	var colorsInfo;
	
	async function TakeGroup () {
		
		var query = `query {findTags(filter: {per_page: -1}, tag_filter: {children: {modifier: NOT_NULL}}) {tags {id, name, sort_name, children{name}}}}`
	
		var response = await fetch(server, {
			
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${key}`
			},
            body: JSON.stringify({ query })
		});
		
		var data = await response.json();

		return data.data.findTags.tags;
	};
	
	const groups = await TakeGroup();

	async function ColorsGroup (id, i) {

		var query = `query {findTags(filter: {per_page: -1}, tag_filter: {parents: {value:["${id}"], modifier: INCLUDES_ALL, depth: -1}}) {tags {name, sort_name}}}`

		var response = await fetch(server, {
			
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${key}`
			},
            body: JSON.stringify({ query })
		});
		
		var data = await response.json();
		
		colorsInfo[i].group = data.data.findTags.tags;
	};
	
	function GetColors () {
		
		var colorsList = option.replaceAll(' ', '').split(',');
		
		var colorsData = [];
		
		colorsList.forEach((color)=>{
			
			var info = color.split(':');
			
			!info[1].includes('#') ? info[1] = `#${info[1]}` : null;
			
			colorsData.push({name:info[0],color:info[1]});
			});
		
		GetColorsId(colorsData);
	};
	
	function GetColorsId (colorsData) {
		
		let find;
		
		colorsData.forEach((color, i)=>{
		
			find = false;
		
			groups.forEach((category)=>{
				
				if (find) return;

				category.name = category.name.replaceAll(' ', '');
				
				if (color.name == category.name) {
					
					colorsData[i].id = category.id;
					colorsData[i].sort_name = category.sort_name;
					find = true;
				};
			});
		});
		
		colorsInfo = colorsData;
	};
	
	async function FindColorsGroup () {
		colorsInfo.forEach(async (color, i) => {
			
			ColorsGroup(color.id, i);
		});
	};
	
	GetColors();
	await FindColorsGroup();
	
	
	function Bounce (func, wait) {
		
		let timeout;
		return function (...args) {
			
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		};
	};
	
	async function Colorize () {

		var tags = document.querySelectorAll('.react-select__multi-value__label, .tag-item, .wall-tag, .parent-tag')
		
		tags ? tags.forEach((tag)=>{ApplyColor(tag)}) : null;
	};
	
	const bounceColorize = Bounce(Colorize, 200);
	const observer = new MutationObserver(bounceColorize);
	observer.observe(document.body, { childList: true, subtree: true });
	
	function ApplyColor (tag) {
		
		if (!tag.getAttribute('data-sort-name')) return;
		
		let find = false;
		
		tagName = tag.firstChild.firstChild.innerText.replaceAll(' ','');
		tagName.includes('|') ? tagName = tagName.replace('|', '') : null;
		
		colorsInfo.forEach((color) => {
			
			if (find) return;
			
			if (tagName == color.name) {
				
				tag.style.background = color.color;
				find = true;
				
			} else {
				
				color.group.forEach((subTag) => {
					
					var code = subTag.sort_name.split('-')[0].replaceAll(' ', '')[0];
					
					if (code != color.sort_name) return;
					
					subTag.name = subTag.name.replaceAll(' ', '');
					
					if (subTag.name == tagName) {
						
						tag.style.background = color.color;
						find = true;
					};
				});
			};
		});
		
	};
	Colorize();
})();