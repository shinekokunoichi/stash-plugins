(async function () {
    let popUps = {
        loading: null,
        suggestion: null
    };
    let cache = {
        performersSuggestion: [],
        tagsSuggestion: [],
        codeSearch: [],
        tagSearch: []
    };
    let currentSearch, currentIndex;
    let settings = sk.plugins.get('skDownloader - JAV');
    const defaultSettings = { language: 'en' };

    //UI
    async function loadingpopUp() {
        const popUp = sk.ui.make.popUp();
        popUp.css('top', '50%');
        popUp.css('left', '50%');
        popUp.css('background', 'rgba(0,0,0,.75)');
        popUp.css('display', 'none');
        popUp.css('padding', '2.5% 5%');
        const title = sk.ui.make.title('Loading...');
        popUp.child(title);
        popUps.loading = popUp;
        document.body.appendChild(popUp.get())
    };

    async function suggestionpopUp() {
        if (!popUps.loading) await loadingpopUp();
        displaypopUp(popUps.loading);
        const popUp = sk.ui.make.popUp('full', 'full', 'center top');
        popUp.css('background', 'rgba(0,0,0,.85)');
        popUp.css('z-indez', 9000);
        popUp.id('JAVD-popUp');
        popUp.css('display', 'none');

        const close = sk.ui.make.title('X');
        close.css('cursor', 'pointer');
        close.css('position', 'fixed');
        close.css('right', 0);
        close.event('click', removeSuggestion);

        const title = sk.ui.make.title();
        const container = sk.ui.make.container('');
        container.flex();
        container.css('justify-content', 'space-around');
        container.css('flex-wrap', 'wrap');

        const next = sk.ui.make.subTitle('Next');
        next.css('cursor', 'pointer');
        next.css('position', 'fixed');
        next.css('bottom', 0);
        next.css('right', 0);
        next.event('click', nextPage);

        const previous = sk.ui.make.subTitle('Previous');
        previous.css('cursor', 'pointer');
        previous.css('position', 'fixed');
        previous.css('bottom', 0);
        previous.css('left', 0);
        previous.event('click', previousPage);

        popUp.child(close);
        popUp.child(title);
        popUp.child(container);
        popUp.child(previous);
        popUp.child(next);

        popUp.container = container;
        popUp.title = title;
        popUps.suggestion = popUp;
        document.body.appendChild(popUp.get());
    };

    function displaypopUp(popUp) {
        popUp.css('display') === 'none' ? popUp.css('display', 'block') : popUp.css('display', 'none');
    };

    function removeSuggestion() {
        popUps.suggestion.remove();
        popUps.suggestion = null;
        currentIndex = undefined;
    };

    function bySearchTerm() {
        if (currentSearch === 'codeSearch' || codeToSearch === 'tagSearch') return true;
        return false;
    };

    async function nextPage() {
        if (!bySearchTerm() && cache[currentSearch].length - 1 === currentIndex) return;
        currentIndex++;
        if (!bySearchTerm() && cache[currentSearch].length - 1 != currentIndex) makeCard();
        if (bySearchTerm()) {
            displaypopUp(popUps.loading);
            let search = cache[currentSearch][0].title;
            const videos = search.includes('-') ? await getVideos(search) : await getVideos(`${search}-`);
            cache[currentSearch] = [{ title: search, videos: videos }];
        };
        await makeCard();
    };

    async function previousPage() {
        if (!bySearchTerm() && currentIndex === 0) return;
        currentIndex--;
        if (bySearchTerm() && currentIndex > 0) {
            displaypopUp(popUps.loading);
            let search = cache[currentSearch][0].title;
            const videos = search.includes('-') ? await getVideos(search) : await getVideos(`${search}-`);
            cache[currentSearch] = [{ title: search, videos: videos }];
        };
        await makeCard();
    };

    async function makeCard() {
        let data = cache[currentSearch];
        data = data[0] ? data[currentIndex] : { title: 'No Data', videos: [] };
        popUps.suggestion.container.html('');
        popUps.suggestion.title.text(data.title.toUpperCase());
        for (video of data.videos) {
            const card = sk.ui.make.container();
            card.flex();
            card.css('flex-direction', 'column');

            const code = sk.ui.make.subTitle(video.code);
            const link = sk.ui.make.link(video.page);

            let blobPreview = await sk.scraper.scrape(video.preview, { blob: true });
            blobPreview = URL.createObjectURL(blobPreview);
            const preview = sk.ui.make.video(blobPreview, { autoPlay: false, muted: true });
            preview.event('mouseenter', function () { this.play(); });
            preview.event('mouseleave', function () { this.pause(); });

            const download = sk.ui.make.description('Download');
            download.css('cursor', 'pointer');
            download.attribute('_key', video.key);
            download.attribute('_code', video.code);
            download.event('click', function () { downloadVideo(this); });

            card.child(code);
            card.child(link);
            link.child(preview);
            card.child(download);
            popUps.suggestion.container.child(card);
        };
        displaypopUp(popUps.loading);
        displaypopUp(popUps.suggestion);
    };

    //DOWNLOADER
    async function getVideos(search) {
        const baseUrl = 'https://njavtv.com/';
        let url = `${baseUrl}${settings.language}/`;
        if (search.includes(' ')) search.replaceAll(' ', '%20');
        query = currentSearch === 'performersSuggestion' ? `${url}actresses/${search}` : `${url}search/${search}?page=${currentIndex + 1}`;
        const page = await sk.scraper.scrape(query, { html: true });
        const videos = page.getAll('.thumbnail.group');
        if (!videos[0]) return false;
        let videosList = [];
        for (video of videos) {
            let data = {};
            data.page = video.firstElementChild.firstElementChild.href;
            data.preview = video.firstElementChild.firstElementChild.firstElementChild.getAttribute('data-src');
            const code = data.page.split(baseUrl)[1].split('/');
            data.code = code[code.length - 1].toUpperCase();
            const details = await sk.scraper.scrape(data.page, { html: true });
            data.key = details.getAll('script')[9].innerText.split('nineyu.com')[1].split('\\/')[1];
            videosList.push(data);
        };
        return videosList;
    };

    async function getVideoUrl(key) {
        const resolutions = [480, 720, 1080, 1440, 2160, 4320];
        const baseUrl = 'https://surrit.com/';
        let find;
        for (resolution of resolutions) {
            const url = `${baseUrl}${key}/${resolution}p/`;
            const response = await sk.hook.getFetch()(`${url}video0.jpeg`);
            if (response.ok) find = url;
        };
        return find;
    };

    async function getParts(url) {
        const parts = await sk.scraper.scrape(`${url}video.m3u8`);
        let find;
        let videoList = parts.split('\n');
        let i;
        do {
            i = videoList.length - 1;
            videoList[i].includes('video') ? find = videoList[i] : videoList.pop();
        } while (!find);

        find = find.replaceAll('video', '').replace('.jpeg', '');
        return find;
    };

    async function downloadVideo(video) {
        let max, fullVideo;
        const key = video.getAttribute('_key');
        const code = video.getAttribute('_code');
        const url = await getVideoUrl(key);
        const parts = await getParts(url);
        let progress = 0;
        sk.notify('skDownloader - JAV', `Downloading ${code}`);
        async function makePlaylist() {
            if (progress <= parts) console.log(`${progress}/${parts}`);
            await getPart();
        };

        async function getPart() {
            if (max) return;
            let part = await sk.hook.getFetch()(`${url}video${progress}.jpeg`);
            if (part.ok) {
                part = await part.blob();
                fullVideo = !fullVideo ? fullVideo = part : fullVideo = new Blob([fullVideo, part], { type: 'video/mp4' });
                progress++;
                makePlaylist();
            } else {
                max = true;
                videoCompleted();
            };
        };

        function videoCompleted() {
            const blobToUrl = URL.createObjectURL(fullVideo);
            const autoDownloader = sk.ui.make.link(blobToUrl);
            autoDownloader.attribute('download', `${code}.mp4`);
            autoDownloader.css('display', 'none');
            document.body.appendChild(autoDownloader.get());
            autoDownloader.get().click();
            URL.revokeObjectURL(blobToUrl);
            autoDownloader.remove();
        };

        makePlaylist();
    };

    //TASK
    async function getFavorites(options) {
        const search = currentSearch === 'performersSuggestion' ? 'findPerformers' : 'findTags';
        const data = await sk.stash[search]('all', { fieldFilter: options });
        let favorites = [];
        for (favorite of data) {
            const video = await getVideos(favorite.name);
            if (video[0]) cache[currentSearch].push({ title: favorite.name, videos: videos });
        };
    };

    async function performersSuggestion() {
        await suggestionpopUp();
        currentIndex = 0;
        currentSearch = 'performersSuggestion';
        if (!cache[currentSearch]) await getFavorites({ filter_favorites: true });
        await makeCard();
    };

    async function tagsSuggestion() {
        await suggestionpopUp();
        currentIndex = 0;
        currentSearch = 'tagsSuggestion';
        if (!cache[currentSearch]) await getFavorites({ favorite: true });
        await makeCard();
    };

    async function codeSearch() {
        await suggestionpopUp();
        currentIndex = 0;
        currentSearch = 'codeSearch';
        const search = prompt('Code to search. Ex: BDSM or BDSM-088');
        if (!search || search === '') return;
        const videos = search.includes('-') ? await getVideos(search) : await getVideos(`${search}-`);
        cache[currentSearch] = [{ title: search, videos: videos }];
        await makeCard();
    };

    async function tagSearch() {
        await suggestionpopUp();
        currentIndex = 0;
        currentIndex = 'tagSearch';
        const search = prompt('Tag to search');
        if (!search || search === '') return;
        const videos = await getVideos(search);
        await makeCard();
    };

    async function main() {
        if (!settings) settings = defaultSettings;
        await sk.useNotification();
        sk.task.new('skDownloader - JAV', 'Favorite performers suggestion', 'Suggest scene by your current favorite performer', performersSuggestion);
        sk.task.new('skDownloader - JAV', 'Favorite tags suggestion', 'Suggest scene by your current favorite tags', tagsSuggestion);
        sk.task.new('skDownloader - JAV', 'Search scene by code', 'Search scene by the given code', codeSearch);
        sk.task.new('skDownloader - JAV', 'Search scene by tag', 'Search scene by the given tag', tagSearch);
    };

    main();
})();