const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || params.get('query') || '';
        const wisp = params.get('wisp') || 'wss://wisp.mercurywork.shop/';
        const backend = params.get('backend') || params.get('proxy') || 'ultraviolet';
        const browser = params.get('browser') || 'duckduckgo';

        
        document.getElementById('browserInfo').textContent = browser;
        document.getElementById('proxyInfo').textContent = backend;
        
        
        const wispDisplay = wisp.replace('wss://', '').replace('ws://', '').replace(/\/$/, '');
        document.getElementById('wispInfo').textContent = wispDisplay;
        
        document.getElementById('urlInfo').textContent = query || 'None';
        document.getElementById('urlInfo').title = query || 'None';

        
        const searcherUrl = new URL('searcher.html', window.location.origin);
        if (query) searcherUrl.searchParams.set('q', query);
        searcherUrl.searchParams.set('wisp', wisp);
        searcherUrl.searchParams.set('backend', backend);
        searcherUrl.searchParams.set('browser', browser);

        
        document.getElementById('searcherFrame').src = searcherUrl.toString();

        
        let barHidden = false;

        function toggleBar() {
            const bar = document.getElementById('infoBar');
            const hint = document.getElementById('hintMessage');
            
            barHidden = !barHidden;
            
            if (barHidden) {
                bar.classList.add('hidden');
                setTimeout(() => {
                    hint.classList.add('visible');
                }, 300);
            } else {
                hint.classList.remove('visible');
                setTimeout(() => {
                    bar.classList.remove('hidden');
                }, 300);
            }
        }