function createSpeedLines() {
            const container = document.querySelector('.bg-container');
            
            
            for (let i = 0; i < 8; i++) {
                const line = document.createElement('div');
                line.className = 'speed-line';
                line.style.top = Math.random() * 100 + '%';
                line.style.width = Math.random() * 300 + 200 + 'px';
                line.style.animationDelay = Math.random() * 2 + 's';
                line.style.animationDuration = (Math.random() * 0.8 + 0.8) + 's';
                container.appendChild(line);
            }

            
            for (let i = 0; i < 8; i++) {
                const line = document.createElement('div');
                line.className = 'speed-line-right';
                line.style.top = Math.random() * 100 + '%';
                line.style.width = Math.random() * 300 + 200 + 'px';
                line.style.animationDelay = Math.random() * 2 + 's';
                line.style.animationDuration = (Math.random() * 0.8 + 0.8) + 's';
                container.appendChild(line);
            }

            
            for (let i = 0; i < 6; i++) {
                const line = document.createElement('div');
                line.className = 'speed-line-vertical';
                line.style.left = Math.random() * 100 + '%';
                line.style.height = Math.random() * 200 + 150 + 'px';
                line.style.animationDelay = Math.random() * 2 + 's';
                line.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
                container.appendChild(line);
            }

            
            for (let i = 0; i < 6; i++) {
                const line = document.createElement('div');
                line.className = 'speed-line-vertical-right';
                line.style.right = Math.random() * 100 + '%';
                line.style.height = Math.random() * 200 + 150 + 'px';
                line.style.animationDelay = Math.random() * 2 + 's';
                line.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
                container.appendChild(line);
            }
        }

        createSpeedLines();