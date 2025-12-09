const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || params.get('query');
        const wisp = params.get('wisp') || 'wss://wisp.mercurywork.shop/';
        const backend = params.get('backend') || params.get('proxy') || 'ultraviolet';
        const browser = params.get('browser') || 'duckduckgo';

        const proxyFrame = document.getElementById('proxyFrame');
        const bgFrame = document.getElementById('bgFrame');
        const errorDiv = document.getElementById('error');
        const loadingDiv = document.getElementById('loading');

        let connection;
        let scramjet;
        let isInitialized = false;

        function showError(message) {
            console.error(message);
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }

        function hideLoading() {
            loadingDiv.style.display = 'none';
        }

        function updateLoadingText(text) {
            document.getElementById('loadingSubtext').textContent = text;
        }

        async function waitForLibraries() {
            let attempts = 0;
            while (!window.BareMux && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.BareMux) {
                throw new Error('BareMux library failed to load');
            }
            
            console.log('BareMux loaded successfully');
        }

        async function initBareMux() {
            try {
                updateLoadingText('Setting up BareMux...');
                
                if (!window.BareMux) {
                    throw new Error('BareMux not loaded');
                }
                
                connection = new BareMux.BareMuxConnection("/baremux/worker.js");
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                updateLoadingText('Connecting to transport...');
                
                const transports = [
                    { path: "/libcurl/index.mjs", name: "libcurl", config: [{ wisp: wisp }] }
                ];
                
                let transportSet = false;
                let lastError = null;
                
                for (const transport of transports) {
                    try {
                        console.log(`Attempting to set transport: ${transport.name} at ${transport.path}`);
                        await connection.setTransport(transport.path, transport.config);
                        
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        const currentTransport = await connection.getTransport();
                        if (currentTransport) {
                            console.log(`✓ BareMux initialized with ${transport.name}:`, wisp);
                            transportSet = true;
                            break;
                        }
                    } catch (e) {
                        console.warn(`✗ ${transport.name} failed:`, e);
                        lastError = e;
                    }
                }
                
                if (!transportSet) {
                    throw new Error('All transport methods failed. ' + (lastError ? lastError.message : 'Check if /search/libcurl/index.mjs exists'));
                }
                
                console.log('BareMux connection ready');
                return true;
            } catch (e) {
                showError("BareMux initialization failed: " + e.message);
                console.error("BareMux init error:", e);
                return false;
            }
        }

        function initScramjet() {
            try {
                if (!window.$scramjetLoadController) {
                    console.warn("Scramjet not available");
                    return null;
                }

                const CONFIG = {
                    prefix: "/scramjet/",
                    files: {
                        wasm: "/sj/scramjet.wasm.wasm",
                        all: "/sj/scramjet.all.js",
                        sync: "/sj/scramjet.sync.js",
                    },
                };
                
                const { ScramjetController } = $scramjetLoadController();
                scramjet = new ScramjetController({
                    prefix: CONFIG.prefix,
                    files: CONFIG.files,
                });
                scramjet.init();
                console.log("Scramjet initialized with prefix:", CONFIG.prefix);
                return scramjet;
            } catch (e) {
                console.error("Scramjet init error:", e);
                return null;
            }
        }

        async function registerSW() {
            if (!("serviceWorker" in navigator)) {
                showError("Service workers not supported in this browser");
                return false;
            }

            try {
                updateLoadingText('Registering service workers...');
                
                if (backend === 'ultraviolet' || backend === 'uv') {
                    const swCheck = await fetch('/uv/sw.js', { method: 'HEAD' }).catch(() => null);
                    if (!swCheck || !swCheck.ok) {
                        throw new Error('UV service worker file not found at /uv/sw.js');
                    }
                    console.log('✓ UV service worker file exists');
                } else if (backend === 'scramjet') {
                    const swCheck = await fetch('/sw.js', { method: 'HEAD' }).catch(() => null);
                    if (!swCheck || !swCheck.ok) {
                        throw new Error('Scramjet service worker file not found at /sw.js');
                    }
                    console.log('✓ Scramjet service worker file exists');
                }
                
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('Unregistered old SW:', registration.scope);
                }
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                if (backend === 'ultraviolet' || backend === 'uv') {
                    const uvReg = await navigator.serviceWorker.register("/uv/sw.js", {
                        scope: "/uv/"
                    });
                    console.log("UV service worker registered:", uvReg.scope);
                } else if (backend === 'scramjet') {
                    const sjReg = await navigator.serviceWorker.register("/sw.js", {
                        scope: "/"
                    });
                    console.log("Scramjet service worker registered:", sjReg.scope);
                    
                    initScramjet();
                }
                
                updateLoadingText('Waiting for service worker...');
                
                const swReady = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Service worker timeout')), 1)
                    )
                ]).catch(e => {
                    console.error('Service worker failed to become ready:', e);
                    return null;
                });
                
                if (!swReady) {
                    console.warn('Service worker not ready, continuing anyway...');
                } else {
                    console.log("Service worker ready:", swReady);
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                return true;
            } catch (e) {
                showError("Service worker setup failed: " + e.message);
                console.error("SW setup error:", e);
                return false;
            }
        }

        function getSearchUrl(query, engine) {
            const encodedQuery = encodeURIComponent(query);
            
            switch(engine) {
                case 'google':
                    return `https://www.google.com/search?q=${encodedQuery}`;
                case 'bing':
                    return `https://www.bing.com/search?q=${encodedQuery}`;
                case 'duckduckgo':
                default:
                    return `https://duckduckgo.com/?q=${encodedQuery}`;
            }
        }

        async function navigate(url) {
            try {
                updateLoadingText('Preparing to navigate...');

                if (connection) {
                    const transport = await connection.getTransport();
                    if (!transport) {
                        console.log("Reinitializing BareMux...");
                        const success = await initBareMux();
                        if (!success) {
                            showError("Failed to initialize BareMux connection");
                            hideLoading();
                            return;
                        }
                    }
                }
                
                let proxyUrl;
                
                if (backend === 'scramjet' && scramjet) {
                    proxyUrl = scramjet.encodeUrl(url);
                    console.log("Using Scramjet:", proxyUrl);
                } else {
                    if (typeof __uv$config === 'undefined') {
                        showError("Ultraviolet config not loaded. Check if /uv/uv.config.js exists.");
                        hideLoading();
                        return;
                    }
                    proxyUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
                    console.log("Using Ultraviolet:", proxyUrl);
                }

                updateLoadingText('Loading page...');
                proxyFrame.src = proxyUrl;
                
                proxyFrame.onload = function() {
                    bgFrame.style.display = 'none';
                    proxyFrame.classList.add('active');
                    hideLoading();
                };

                proxyFrame.onerror = function() {
                    showError("Failed to load proxied page");
                    hideLoading();
                };
                
            } catch (e) {
                showError("Navigation error: " + e.message);
                console.error('Navigation error:', e);
                hideLoading();
            }
        }

        async function init() {
            try {
                await waitForLibraries();
                const swReady = await registerSW();
                if (!swReady) {
                    showError("Service worker registration failed");
                    hideLoading();
                    return;
                }

                updateLoadingText('Initializing BareMux...');
                const bmReady = await initBareMux();
                if (!bmReady) {
                    showError("BareMux initialization failed");
                    hideLoading();
                    return;
                }
                
                isInitialized = true;
                
                if (query) {
                    let url = query.trim();

                    if (!url.includes(".") || url.includes(" ")) {
                        url = getSearchUrl(url, browser);
                    } else {
                        if (!url.startsWith("http://") && !url.startsWith("https://")) {
                            url = "https://" + url;
                        }
                    }
                    
                    console.log("Navigating to:", url);
                    setTimeout(() => navigate(url), 2000);
                } else {
                    hideLoading();
                }
            } catch (e) {
                showError("Initialization error: " + e.message);
                console.error("Init error:", e);
                hideLoading();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }