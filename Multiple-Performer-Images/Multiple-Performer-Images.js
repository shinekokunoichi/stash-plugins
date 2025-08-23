(async () => {
	
	const server = 'http://localhost:9999/graphql';
	const key = '';
	var option = window.__APOLLO_CLIENT__.cache.data.data.ROOT_QUERY.configuration.plugins['Multiple-Performer-Images'];
	
	async function AllPerformers () {
		
		var query = 'query {allPerformers {id, custom_fields, image_path}}';
		
		var response = await fetch(server, {
			
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${key}`
			},
            body: JSON.stringify({ query })
		});
		
		var data = await response.json();
		
		return data.data.allPerformers;
	};
	
	async function OnePerformer (id) {
		
		var query = `query {findPerformer(id:${id}) {custom_fields, image_path}}`;
		
		var response = await fetch(server, {
			
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${key}`
			},
            body: JSON.stringify({ query })
		});
		
		var data = await response.json();
		
		return data.data.findPerformer;
	};
	
	function SetDefault () {
		
		if (option == undefined) {
			
			option['Default_Image'] = 'portrait';
			option['Replace_Detail'] = true;
			option['Replace_List'] = true;
		};
		
		var defaultImage = option['Default_Image'].toLowerCase();
		
		defaultImage == 'portrait' ? null :
		defaultImage == 'clothed' ? null :
		defaultImage == 'skimpy'  ? null :
		defaultImage == 'nude'     ? null : defaultImage = 'portrait';	
		
		CheckPage();
	};
	
	function CheckPage () {
		
		var currentPage = window.location.href.split('performers/');
		var imgReplace = option['Replace_Detail'];
		var listReplace = option['Replace_List'];

		if (currentPage[1] == undefined) {
			
			listReplace ? ReplaceAll() : null;
			
		} else {
			
			var id = currentPage[1].split('/')[0];
						
			imgReplace ? ReplaceOne(id) : SlideOne(id);
		};
	};
	
	function FindPerformer (data, id) {
		
		var find;
		
		data.forEach((performer) => {
			
			performer.id == id ? find = performer : null;
		});
		
		return find;
	};
	
	async function ReplaceAll () {
		
		let performersData = await AllPerformers();
				
		var  performersList = document.querySelectorAll('.thumbnail-section');
				
		performersList.forEach((performer) => {
						
			var performerId    = performer.firstChild.href.split('performers/')[1];
			var performerImg = performer.firstChild.firstChild;
			
			var data = FindPerformer(performersData, performerId);
			
			var newImage = data.custom_fields[option['Default_Image'].toLowerCase()];
			var oldImage = data.image_path;
			
			performerImg.src = newImage ? newImage : oldImage;
		});
	};
	
	async function ReplaceOne (id) {

		let performerData = await OnePerformer(id);
		
		var performerImage = document.querySelectorAll('img.performer')[0];
		
		var newImage = performerData.custom_fields[option['Default_Image'].toLowerCase()];
		var oldImage  = performerData.image_path;

		performerImage.src = newImage ? newImage :  oldImage;
	};
	
	var totalDot = 1;
	
	async function SlideOne (id) {
		
		if (document.querySelector('#MPI_default')) return;

		let performerData = await OnePerformer(id);
		var imgList = performerData.custom_fields;
		
		var defaultImg = document.querySelectorAll('img.performer')[0];
		var imgAlt = defaultImg.alt;
		var imgGroup = defaultImg.parentElement;
		var portrait, clothed, skimpy, nude;
		
		defaultImg.id = 'MPI_default';
		defaultImg.classList.add('MPI');
		
		portrait = imgList['portrait'].toLowerCase();
		clothed = imgList['clothed'].toLowerCase();
		skimpy = imgList['skimpy'].toLowerCase();
		nude = imgList['nude'].toLowerCase();
		
		portrait ? MakeImg('portrait', portrait, imgAlt) : null;
		clothed ? MakeImg('clothed', clothed, imgAlt) : null;
		skimpy ? MakeImg('skimpy', skimpy, imgAlt) : null;
		nude ? MakeImg('nude', nude, imgAlt) : null;
		
		document.querySelector('.detail-header-image').style.alignItems = 'flex-end';
		
		MakeDot('default');
		portrait ? MakeDot('portrait') : null
		clothed ? MakeDot('clothed') : null
		skimpy ? MakeDot('skimpy') : null
		nude ? MakeDot('nude') : null
	};
	
	function MakeImg (type, path, meta) {
		
		var newImage = document.createElement('IMG');
		
		newImage.src = path;
		newImage.className = 'performer MPI';
		newImage.alt = meta;
		newImage.attributes.width = '736';
		newImage.id = `MPI_${type}`;
		newImage.style.display = 'none';
		
		document.querySelectorAll('img.performer')[0].parentElement.appendChild(newImage);
	};
	
	function MakeDot (type) {
		
		var newDot = document.createElement('DIV');
		var distance = totalDot*2 + 5;
		
		newDot.id = `MPI_D${type}`;
		newDot.className = 'MPI_D'
		newDot.style.width = '20px';
		newDot.style.height = '20px';
		newDot.style.borderRadius= '100%';
		newDot.style.position = 'fixed';
		newDot.style.left = `${distance}%`;
		newDot.style.backgroundColor = type == 'default' ? 'var(--primary)' : 'var(--secondary)';
		
		newDot.onclick = CheckDot;
		
		document.querySelector('.detail-header-image').appendChild(newDot);
		
		totalDot++;
	};
	
	function CheckDot () {
		
		document.querySelectorAll('.MPI_D').forEach((dot) => {DisableDot(dot)});
		document.querySelectorAll('.MPI').forEach((img) => {img.style.display = 'none'});
		
		ActiveDot(this);
	};
	
	function ActiveDot (el) {
		
		el.style.backgroundColor = 'var(--primary)';
		var type = el.id.split('MPI_D')[1];
		document.querySelector(`#MPI_${type}`).style.display = 'block';
	};
	
	function DisableDot (el) {
		
		el.style.backgroundColor = 'var(--secondary)';
	};
	
	function Bounce (func, wait) {
		
		let timeout;
		return function (...args) {
			
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		};
	};
	
	async function IsPerformer () {
		
		var performerLoaded = document.querySelectorAll('img.performer')[0] || document.querySelectorAll('.performer-card')[0];

		if (window.location.href.includes('performers') && performerLoaded) SetDefault();
	};
	
	const bouncePerformer = Bounce(IsPerformer, 300);
	const observer = new MutationObserver(bouncePerformer);
	observer.observe(document.body, { childList: true, subtree: true });
	
	IsPerformer();
})();