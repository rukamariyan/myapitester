// Main JavaScript file for API Tester

class ApiTester {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeForm();
    }

    bindEvents() {
        // Request form submission
        const requestForm = document.getElementById('requestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', (e) => this.handleRequestSubmit(e));
        }

        // Auth type changes
        const authTypeSelect = document.getElementById('authType');
        if (authTypeSelect) {
            authTypeSelect.addEventListener('change', (e) => this.handleAuthTypeChange(e));
        }

        // Header management
        this.initializeHeaderManagement();

        // Body type changes
        const bodyTypeSelect = document.getElementById('bodyType');
        if (bodyTypeSelect) {
            bodyTypeSelect.addEventListener('change', (e) => this.handleBodyTypeChange(e));
        }

        // Save request form
        const saveRequestForm = document.getElementById('saveRequestForm');
        if (saveRequestForm) {
            saveRequestForm.addEventListener('submit', (e) => this.handleSaveRequest(e));
        }

        // Load request functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.load-request')) {
                const requestId = e.target.closest('.load-request').dataset.requestId;
                this.loadRequest(requestId);
            }
        });
    }

    initializeForm() {
        // Set default values
        this.handleAuthTypeChange({ target: { value: '' } });
        this.handleBodyTypeChange({ target: { value: 'json' } });
    }

    initializeHeaderManagement() {
        // Add header button
        const addHeaderBtn = document.getElementById('addHeader');
        if (addHeaderBtn) {
            addHeaderBtn.addEventListener('click', () => this.addHeaderRow());
        }

        // Remove header buttons (delegated event)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-header')) {
                this.removeHeaderRow(e.target.closest('.header-row'));
            }
        });
    }

    addHeaderRow() {
        const container = document.getElementById('headersContainer');
        const firstRow = container.querySelector('.header-row');
        
        if (firstRow) {
            const newRow = firstRow.cloneNode(true);
            newRow.querySelectorAll('input').forEach(input => {
                input.value = '';
            });
            container.appendChild(newRow);
            
            // Re-initialize Feather icons
            feather.replace();
        }
    }

    removeHeaderRow(row) {
        const container = document.getElementById('headersContainer');
        const rows = container.querySelectorAll('.header-row');
        
        if (rows.length > 1) {
            row.remove();
        } else {
            // Clear the last row instead of removing it
            row.querySelectorAll('input').forEach(input => {
                input.value = '';
            });
        }
    }

    handleAuthTypeChange(e) {
        const authType = e.target.value;
        const authSections = document.querySelectorAll('.auth-section');
        
        // Hide all auth sections
        authSections.forEach(section => {
            section.classList.add('d-none');
        });

        // Show selected auth section
        if (authType) {
            const targetSection = document.getElementById(authType + 'Auth') || 
                                 document.getElementById(authType + 'TokenAuth');
            if (targetSection) {
                targetSection.classList.remove('d-none');
            }
        }
    }

    handleBodyTypeChange(e) {
        const bodyType = e.target.value;
        const bodyTextarea = document.getElementById('requestBody');
        
        if (bodyTextarea) {
            switch (bodyType) {
                case 'json':
                    bodyTextarea.placeholder = '{\n  "key": "value"\n}';
                    break;
                case 'form':
                    bodyTextarea.placeholder = 'key1=value1\nkey2=value2';
                    break;
                case 'raw':
                    bodyTextarea.placeholder = 'Raw text content...';
                    break;
            }
        }
    }

    collectHeaders() {
        const headers = {};
        const headerRows = document.querySelectorAll('.header-row');
        
        headerRows.forEach(row => {
            const keyInput = row.querySelector('.header-key');
            const valueInput = row.querySelector('.header-value');
            
            if (keyInput && valueInput && keyInput.value.trim() && valueInput.value.trim()) {
                headers[keyInput.value.trim()] = valueInput.value.trim();
            }
        });
        
        return headers;
    }

    collectAuthData() {
        const authType = document.getElementById('authType').value;
        
        if (!authType) return {};

        switch (authType) {
            case 'bearer':
                return {
                    token: document.getElementById('bearerToken').value
                };
            case 'apikey':
                return {
                    in: document.getElementById('apiKeyLocation').value,
                    key: document.getElementById('apiKeyName').value,
                    value: document.getElementById('apiKeyValue').value
                };
            case 'basic':
                return {
                    username: document.getElementById('basicUsername').value,
                    password: document.getElementById('basicPassword').value
                };
            default:
                return {};
        }
    }

    async handleRequestSubmit(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i data-feather="loader" class="me-1"></i>Sending...';
            feather.replace();

            // Collect form data
            const formData = new FormData();
            formData.append('method', document.getElementById('method').value);
            formData.append('url', document.getElementById('url').value);
            formData.append('headers', JSON.stringify(this.collectHeaders()));
            formData.append('body', document.getElementById('requestBody').value);
            formData.append('body_type', document.getElementById('bodyType').value);
            formData.append('auth_type', document.getElementById('authType').value);
            formData.append('auth_data', JSON.stringify(this.collectAuthData()));

            // Send request
            const response = await fetch('/send_request', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.displayResponse(result);

        } catch (error) {
            console.error('Error sending request:', error);
            this.displayError('Failed to send request: ' + error.message);
        } finally {
            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            feather.replace();
        }
    }

    displayResponse(result) {
        const responsePanel = document.getElementById('responsePanel');
        const statusElement = document.getElementById('responseStatus');
        const timeElement = document.getElementById('responseTime');
        const sizeElement = document.getElementById('responseSize');
        const bodyElement = document.getElementById('responseBody');
        const headersElement = document.getElementById('responseHeaders');

        if (result.success) {
            // Update status badges
            statusElement.textContent = `${result.status_code} ${result.status_text || ''}`;
            statusElement.className = `badge ${this.getStatusClass(result.status_code)}`;
            
            timeElement.textContent = `${Math.round(result.response_time * 1000)}ms`;
            sizeElement.textContent = this.formatBytes(result.size || 0);

            // Display response body
            if (typeof result.body === 'object') {
                bodyElement.textContent = JSON.stringify(result.body, null, 2);
                bodyElement.className = 'language-json';
            } else {
                bodyElement.textContent = result.body || 'No response body';
                bodyElement.className = 'language-text';
            }

            // Display response headers
            if (result.headers) {
                headersElement.innerHTML = '';
                Object.entries(result.headers).forEach(([key, value]) => {
                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'border-bottom py-2';
                    headerDiv.innerHTML = `
                        <strong>${this.escapeHtml(key)}:</strong> 
                        <span class="text-muted">${this.escapeHtml(value)}</span>
                    `;
                    headersElement.appendChild(headerDiv);
                });
            } else {
                headersElement.innerHTML = '<div class="text-muted">No headers</div>';
            }
        } else {
            // Display error
            statusElement.textContent = 'Error';
            statusElement.className = 'badge bg-danger';
            
            timeElement.textContent = result.response_time ? `${Math.round(result.response_time * 1000)}ms` : '-';
            sizeElement.textContent = '0 B';

            bodyElement.textContent = result.error || 'Unknown error occurred';
            bodyElement.className = 'language-text';
            
            headersElement.innerHTML = '<div class="text-muted">No headers</div>';
        }

        // Show response panel and trigger syntax highlighting
        responsePanel.style.display = 'block';
        if (window.Prism) {
            Prism.highlightElement(bodyElement);
        }

        // Scroll to response
        responsePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    displayError(message) {
        const responsePanel = document.getElementById('responsePanel');
        const statusElement = document.getElementById('responseStatus');
        const timeElement = document.getElementById('responseTime');
        const sizeElement = document.getElementById('responseSize');
        const bodyElement = document.getElementById('responseBody');
        const headersElement = document.getElementById('responseHeaders');

        statusElement.textContent = 'Error';
        statusElement.className = 'badge bg-danger';
        timeElement.textContent = '-';
        sizeElement.textContent = '0 B';
        bodyElement.textContent = message;
        bodyElement.className = 'language-text';
        headersElement.innerHTML = '<div class="text-muted">No headers</div>';

        responsePanel.style.display = 'block';
        responsePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    getStatusClass(statusCode) {
        if (statusCode >= 200 && statusCode < 300) return 'bg-success';
        if (statusCode >= 300 && statusCode < 400) return 'bg-info';
        if (statusCode >= 400 && statusCode < 500) return 'bg-warning';
        if (statusCode >= 500) return 'bg-danger';
        return 'bg-secondary';
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadRequest(requestId) {
        try {
            const response = await fetch(`/load_request/${requestId}`);
            if (!response.ok) {
                throw new Error('Failed to load request');
            }

            const requestData = await response.json();
            this.populateForm(requestData);
        } catch (error) {
            console.error('Error loading request:', error);
            alert('Failed to load request');
        }
    }

    populateForm(requestData) {
        // Basic request data
        document.getElementById('method').value = requestData.method || 'GET';
        document.getElementById('url').value = requestData.url || '';
        document.getElementById('requestBody').value = requestData.body || '';
        document.getElementById('bodyType').value = requestData.body_type || 'json';
        document.getElementById('authType').value = requestData.auth_type || '';

        // Headers
        this.populateHeaders(requestData.headers || {});

        // Auth data
        this.populateAuthData(requestData.auth_type, requestData.auth_data || {});

        // Trigger change events
        this.handleAuthTypeChange({ target: { value: requestData.auth_type || '' } });
        this.handleBodyTypeChange({ target: { value: requestData.body_type || 'json' } });

        // Show success message
        this.showToast('Request loaded successfully', 'success');
    }

    populateHeaders(headers) {
        const container = document.getElementById('headersContainer');
        
        // Clear existing headers
        container.innerHTML = '';

        const headerEntries = Object.entries(headers);
        if (headerEntries.length === 0) {
            headerEntries.push(['', '']); // Add one empty row
        }

        headerEntries.forEach(([key, value]) => {
            const row = this.createHeaderRow(key, value);
            container.appendChild(row);
        });
    }

    createHeaderRow(key = '', value = '') {
        const row = document.createElement('div');
        row.className = 'row mb-2 header-row';
        row.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control header-key" placeholder="Header name" value="${this.escapeHtml(key)}">
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control header-value" placeholder="Header value" value="${this.escapeHtml(value)}">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-outline-danger remove-header">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
        `;
        return row;
    }

    populateAuthData(authType, authData) {
        if (!authType || !authData) return;

        switch (authType) {
            case 'bearer':
                document.getElementById('bearerToken').value = authData.token || '';
                break;
            case 'apikey':
                document.getElementById('apiKeyLocation').value = authData.in || 'header';
                document.getElementById('apiKeyName').value = authData.key || '';
                document.getElementById('apiKeyValue').value = authData.value || '';
                break;
            case 'basic':
                document.getElementById('basicUsername').value = authData.username || '';
                document.getElementById('basicPassword').value = authData.password || '';
                break;
        }
    }

    handleSaveRequest(e) {
        // Add current form data to the save form
        const saveForm = e.target;
        
        // Create hidden inputs for current request data
        const hiddenInputs = [
            { name: 'method', value: document.getElementById('method').value },
            { name: 'url', value: document.getElementById('url').value },
            { name: 'headers', value: JSON.stringify(this.collectHeaders()) },
            { name: 'body', value: document.getElementById('requestBody').value },
            { name: 'body_type', value: document.getElementById('bodyType').value },
            { name: 'auth_type', value: document.getElementById('authType').value },
            { name: 'auth_data', value: JSON.stringify(this.collectAuthData()) }
        ];

        // Remove existing hidden inputs
        saveForm.querySelectorAll('input[type="hidden"]').forEach(input => input.remove());

        // Add new hidden inputs
        hiddenInputs.forEach(input => {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = input.name;
            hiddenInput.value = input.value;
            saveForm.appendChild(hiddenInput);
        });
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ApiTester();
});

// Utility functions
window.ApiTesterUtils = {
    // Format JSON with proper indentation
    formatJSON: function(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2);
        } catch (error) {
            return jsonString;
        }
    },

    // Validate JSON
    isValidJSON: function(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (error) {
            return false;
        }
    },

    // Copy text to clipboard
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('Text copied to clipboard');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
};
