(() => {
    const pluginName = 'skExtra - Image-Upscaler';
    let upscaler, isBusy, lightboxBounding;
    let upscaledCache = {};

    async function initialize() {
        // Settings
        await setDefaultSettings();

        // Upscaler
        await loadUpscalerModel();
        await warmUpUpscaler();

        // Watcher
        setWatcher();

        // Compatibility
        skManagerCompatibility();
    };

    // Settings
    async function setDefaultSettings() {
        await sk.plugin.check({
            name: pluginName,
            options: { sizeRequirements: '600x300' }
        })
    };

    // Upscaler
    async function loadUpscalerModel() {
        const urls = [
            'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
            'https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-slim@latest/dist/umd/2x.min.js',
            'https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js'
        ];

        for (const url of urls) {
            const response = await fetch(url);
            js = await response.text();

            const script = document.createElement('script');
            script.innerText = js;
            script.type = 'text/javascript';

            document.head.append(script);
        };
    };

    async function warmUpUpscaler() {
        upscaler = new Upscaler({ model: ESRGANSlim2x });
        await upscaler.warmup([{
            patchSize: 64,
            padding: 2
        }]);

        warmedUp = true;
    };

    // Watcher
    function setWatcher() {
        sk.tool.wait('.Lightbox', getUpscaleImages);
    };

    async function getUpscaleImages() {
        const { sizeRequirements } = sk.plugin.get(pluginName);
        const [width, height] = sizeRequirements.split('x');

        const pictures = sk.tool.getAll('.Lightbox-carousel-image picture');
        const currentView = Number(sk.tool.get('.Lightbox-carousel').style('left').replace('-', '').replace('vw', '')) / 100;

        for (let i = 0; i < pictures.length; i++) {
            const picture = pictures[i];
            const image = picture.child()[1];

            do { await delay(); }
            while (image.element.width === 0);

            if (image.element.width <= Number(width) || image.element.height <= Number(height)) {
                do { await delay(); }
                while (isBusy);

                if (!picture.class().includes('skUpscaled')) {
                    picture.class('skUpscaling');

                    const url = image.url();

                    if (!upscaledCache[url]) await upscaleImage(url, i);
                    if (upscaledCache[url]) {
                        const image = new Image();
                        image.src = upscaledCache[url].url;

                        picture.element.replaceChildren(image);

                        if (currentView === i && i === 0) transformImage(picture, image);
                    };
                } else if (currentView === i) transformImage(picture, picture.child()[0].element);
            };
        };
    };

    function delay() {
        return new Promise(resolve => setTimeout(resolve, 100))
    };

    async function upscaleImage(url, i) {
        isBusy = true;

        const upscaledImage = new Image();
        const tempImage = new Image();

        tempImage.onload = () => {
            upscaler.execute(tempImage, {
                output: 'base64',
                patchSize: 64,
                padding: 2
            }).then(upscaledURL => {
                upscaledCache[url] = upscaledURL;

                upscaledImage.onload = () => {
                    if (sk.tool.getAll('.skUpscaled')[i]) return;

                    upscaledCache[url] = {
                        index: i,
                        url: upscaledURL
                    };

                    const picture = sk.tool.get('.skUpscaling');
                    picture.class('skUpscaling skUpscaled');

                    picture.element.replaceChildren(upscaledImage);

                    if (i === 0) transformImage(picture, upscaledImage);

                    isBusy = false;
                };

                upscaledImage.src = upscaledURL;
            });
        };

        tempImage.src = url;
    };

    function transformImage(picture, image) {
        if (!lightboxBounding) lightboxBounding = sk.tool.get('.Lightbox-carousel-image').element.getBoundingClientRect();
        let imageBounding = image.getBoundingClientRect();

        const widthScale = lightboxBounding.width / imageBounding.width;
        const heightScale = lightboxBounding.height / imageBounding.height;

        if (widthScale >= 1 && heightScale >= 1) return;

        if (widthScale > heightScale) picture.style({ transform: `scale(${heightScale})` });
        if (widthScale < heightScale) picture.style({ transform: `scale(${widthScale})` });

        imageBounding = image.getBoundingClientRect();

        const translateX = imageBounding.right > lightboxBounding.right ? lightboxBounding.right - imageBounding.right : 0;
        const translateY = imageBounding.bottom > lightboxBounding.bottom ? lightboxBounding.bottom - imageBounding.bottom : 0;

        const transform = picture.style('transform');
        picture.style({ transform: `translate(${translateX}px, ${translateY}px) ${transform}` });
    };

    // Compatibility
    function skManagerCompatibility() {
        if (window._skManager) window._skManager.load({
            name: pluginName,
            updates: [
                {
                    version: '1.0',
                    description: 'Plugin created.'
                }
            ]
        });
    };

    initialize();
})();