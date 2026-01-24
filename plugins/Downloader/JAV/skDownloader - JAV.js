(async function () {
    let popUp, favoritePerformers, favoriteTags, codeToSearch, searchCode, tagToSearch, searchTag, currentIndex, currentSearch;
    const resolutions = [480, 720, 1080, 1440, 2160, 4320];
    let settings = sk.plugins.get('skDownloader - JAV');
    const defaultSetting = { language: 'en' };
    function searchingFor() {
        if (currentSearch === 'performer') return favoritePerformers;
        if (currentSearch === 'tag') return favoriteTags;
        if (currentSearch === 'code') return searchCode;
        if (currentSearch === 'tagSearch') return searchTag;
    };

    function bySearchTerm() {
        if (currentSearch === 'code' || codeToSearch === 'tagSearch') return true;
        return false;
    };

    function closePopUp() {
        popUp.remove();
        popUp = undefined;
        currentIndex = null;
    };

    async function nextPage() {
        if (!bySearchTerm() && searchingFor().length - 1 === currentIndex) return;
        popUp.container.get().re
        currentIndex++;
        if (!bySearchTerm() && searchingFor().length - 1 != currentIndex) makeCard();
        if (bySearchTerm()) {
            const search = currentSearch === 'code' ? codeToSearch + '-' : tagToSearch;
            const videos = await downloadData(search);
            const newData = { title: search, videos: videos };
            currentSearch === 'code' ? searchCode = newData : searchTag = newData;
            await makeCard();
        };
    };

    async function previousPage() {
        if (currentIndex === 0 || bySearchTerm() && currentIndex === 1) return;
        currentIndex--;
        makeCard();
    };

    async function suggestionPopUp() {
        popUp = sk.ui.make.popUp('full', 'full', 'center top');
        popUp.css('background', 'rgba(0,0,0,.75)');
        popUp.id('JAVD-PopUp');
        popUp.css('display', 'none');

        const close = sk.ui.make.title('X');
        close.css('cursor', 'pointer');
        close.css('position', 'fixed');
        close.css('right', 0);
        close.event('click', closePopUp);

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
    };

    async function makeCard() {
        data = searchingFor();
        data = data[0] ? data[currentIndex] : { title: 'No Data', videos: [] };
        popUp.container.html('');
        popUp.title.text(data.title.toUpperCase());
        if (data.videos[0]) for (video of data.videos) {
            const card = sk.ui.make.container();
            card.flex();
            card.css('flex-direction', 'column');
            const code = sk.ui.make.subTitle(video.code);
            const link = sk.ui.make.link(video.page);
            let blobPreview = await sk.hook.getFetch()(video.preview).then(response => response.blob());
            const preview = sk.ui.make.video(URL.createObjectURL(blobPreview), { autoPlay: false, muted: true });
            const download = sk.ui.make.description('Download');
            download.css('cursor', 'pointer');
            download.attribute('_link', video.download);
            download.attribute('_code', video.code)
            card.child(code);
            card.child(link);
            link.child(preview);
            card.child(download);
            popUp.container.child(card);

            download.event('click', function () { downloadVideo(this); });
            preview.event('mouseenter', function () { this.play(); });
            preview.event('mouseleave', function () { this.pause(); });
        };
        document.body.appendChild(popUp.get());
    };

    async function downloadVideo(el) {
        let max, fullVideo;
        const video = el;
        const url = video.getAttribute('_link');
        const code = video.getAttribute('_code');
        let progress = 0;
        sk.notify('skDownloader - JAV', `Download started for ${code}`);

        function makePlaylist() {
            console.log(progress);
            getPart();
        };

        async function getPart() {
            if (max) {
                videoCompleted();
                return;
            };
            try {
                sk.hook._fetch(`${url}video${progress}.jpeg`)
                    .then(resp => resp.blob())
                    .then(blob => {
                        fullVideo = !fullVideo ? fullVideo = blob : fullVideo = new Blob([fullVideo, blob], { type: 'image/jpeg' });
                        progress++;
                        makePlaylist();
                    });
            } catch {
                max = true;
                videoCompleted();
            };
        };

        function videoCompleted() {
            const blobToUrl = URL.createObjectURL(fullVideo);
            const autoDownloader = sk.ui.make.link(blobToUrl);
            autoDownloader.attribute('download', `${code}.jpeg`);
            autoDownloader.css('display', 'none');
            document.appendChild(autoDownloader);
            autoDownloader.get().click();
            URL.revokeObjectURL(blobToUrl);
            autoDownloader.remove();
        };

        makePlaylist();
    };

    async function fakeDownload(url) {
        const response = await sk.hook.getFetch()(`${url}video0.jpeg`);
        return response.status === 200 ? response : false;
    };

    async function tryDownloadLink(key) {
        const baseUrl = 'https://surrit.com/';
        let find, realUrl;
        for (resolution of resolutions) {
            const testUrl = `${baseUrl}${key}/${resolution}p/`;
            find = await fakeDownload(testUrl);
            if (find) realUrl = testUrl;
        };
        return realUrl;
    };

    async function getDownloadLink(videoPage) {
        const keyScript = videoPage.getAll('script')[9];
        const key = keyScript.innerText.split('nineyu.com')[1].split('\\/')[1];
        const url = await tryDownloadLink(key);
        return url;
    };

    async function downloadData(search) {
        const baseUrl = 'https://njavtv.com/';
        const language = settings.language;
        let query;
        search = search.includes(' ') ? search.replaceAll(' ', '%20') : search;
        query = currentSearch === 'performer' ? `${baseUrl}${language}/actresses/${search}` : `${baseUrl}${language}/search/${search}?page=${currentIndex + 1}`;
        const page = await sk.scraper.scrape(query, { html: true });
        const result = page.getAll('.thumbnail.group');
        if (!result[0]) return false;
        let videoList = [];
        for (video of result) {
            let videoData = {}
            videoData.page = video.firstElementChild.firstElementChild.href;
            videoData.preview = video.firstElementChild.firstElementChild.firstElementChild.getAttribute('data-src');
            const code = videoData.page.split(baseUrl)[1].split('/');
            videoData.code = code[code.length - 1].toUpperCase();
            const details = await sk.scraper.scrape(videoData.page, { html: true });
            videoData.download = await getDownloadLink(details);
            videoList.push(videoData);
        };
        return videoList;
    };

    async function favoritePerformersSuggestion() {
        await suggestionPopUp();
        currentIndex = 0;
        currentSearch = 'performer';
        if (!favoritePerformers) {
            const performers = await sk.stash.findPerformers('all', { fieldFilter: { filter_favorites: true } });
            favoritePerformers = [];
            for (performer of performers) {
                const videos = await downloadData(performer.name);
                if (videos[0]) favoritePerformers.push({ title: performer.name, videos: videos });
            };
        };
        await makeCard();
        popUp.css('display', 'block');
    };

    async function favoriteTagsSuggestion() {
        await suggestionPopUp();
        currentIndex = 0;
        currentSearch = 'tag';
        if (!favoriteTags) {
            const tags = await sk.stash.findTags('all', { fieldFilter: { favorite: true } });
            favoriteTags = [];
            for (tag of tags) {
                const videos = await downloadData(tag.name);
                if (videos[0]) favoriteTags.push({ title: tag.name, videos: videos });
            };
        };
        await makeCard();
        popUp.css('display', 'block');
    };

    async function searchCodeSuggestion() {
        await suggestionPopUp();
        currentIndex = 0;
        currentSearch = 'code';
        codeToSearch = prompt('Code to search');
        const videos = codeToSearch.includes('-') ? await downloadData(codeToSearch) : await downloadData(codeToSearch + '-');
        searchCode = [{ title: codeToSearch, videos: videos }];
        await makeCard();
        popUp.css('display', 'block');
    };

    async function searchTagSuggestion() {
        await suggestionPopUp();
        currentIndex = 0;
        currentSearch = 'tagSearch';
        tagToSearch = prompt('Tag to search');
        const videos = await downloadData(tagToSearch);
        searchTag = [{ title: tagToSearch, videos: videos }];
        await makeCard();
        popUp.css('display', 'block');
    };

    async function unlocker() {
        if (!settings) settings = defaultSetting;
        await sk.useNotification();
        sk.task.new('skDownloader - JAV', 'Favorite performers suggestion', 'Suggest scene by your current favorite performer', favoritePerformersSuggestion);
        sk.task.new('skDownloader - JAV', 'Favorite tags suggestion', 'Suggest scene by your current favorite tags', favoriteTagsSuggestion);
        sk.task.new('skDownloader - JAV', 'Search scene by code', 'Search scene by the given code', searchCodeSuggestion);
        sk.task.new('skDownloader - JAV', 'Search scene by tag', 'Search scene by the given tag', searchTagSuggestion);
    };

    unlocker();
})();