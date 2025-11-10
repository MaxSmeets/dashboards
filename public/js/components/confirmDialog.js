// Reusable confirm dialog
export function showConfirmDialog(options = {}) {
    const {
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        danger = false
    } = options;
    
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box" role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-message">
                <h3 id="dialog-title">${title}</h3>
                <p id="dialog-message">${message}</p>
                <div class="dialog-actions">
                    <button class="btn-secondary" id="dialog-cancel">${cancelText}</button>
                    <button class="${danger ? 'btn-danger' : 'btn-primary'}" id="dialog-confirm">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const confirmBtn = overlay.querySelector('#dialog-confirm');
        const cancelBtn = overlay.querySelector('#dialog-cancel');
        
        confirmBtn.focus();
        
        const cleanup = () => {
            overlay.remove();
        };
        
        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false);
            }
        });
        
        // ESC to cancel
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', keyHandler);
                resolve(false);
            }
        };
        document.addEventListener('keydown', keyHandler);
    });
}
