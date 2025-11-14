document.addEventListener('DOMContentLoaded', () => {

    const getStoredTheme = () => localStorage.getItem('theme');
    const setStoredTheme = theme => localStorage.setItem('theme', theme);

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = theme => {
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme);
        }
    };

    setTheme(getPreferredTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getStoredTheme() === 'auto') {
            setTheme('auto');
        }
    });

    document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const theme = toggle.getAttribute('data-bs-theme-value');
            setStoredTheme(theme);
            setTheme(theme);
        });
    });

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // --- Seletores do DOM para o formulário ---
    const analysisForm = document.getElementById('analysis-form');
    const emailText = document.getElementById('email-text');
    const emailFile = document.getElementById('email-file');
    const analyzeButton = document.getElementById('analyze-button');
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');
    
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const resultsDisplay = document.getElementById('results-display');
    const classificationBadge = document.getElementById('classification-badge');
    const suggestedReply = document.getElementById('suggested-reply');
    const copyButton = document.getElementById('copy-button');

    const textTab = document.getElementById('text-tab');
    const fileTab = document.getElementById('file-tab');

    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');

    
    // Função para atualizar o nome do arquivo exibido
    const updateFileName = (file) => {
        if (file) {
            fileNameDisplay.textContent = `Arquivo selecionado: ${file.name}`;
        } else {
            fileNameDisplay.textContent = '';
        }
    };
    
    // Prevenir comportamentos padrão
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
        document.body.addEventListener(eventName, (e) => { 
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/plain' || file.type === 'application/pdf') {
                emailFile.files = files; // Atribui o arquivo ao input escondido
                updateFileName(file);
                // Limpar o textarea para evitar envio duplo
                emailText.value = ''; 
            } else {
                alert('Formato de arquivo não suportado. Use .txt ou .pdf.');
                updateFileName(null);
            }
        }
    }, false);

    // Lidar com seleção de arquivo via clique
    emailFile.addEventListener('change', () => {
        if (emailFile.files.length > 0) {
            updateFileName(emailFile.files[0]);
            // Limpar o textarea
            emailText.value = ''; 
        }
    });

    // Limpar o arquivo quando clicar na aba de texto
    textTab.addEventListener('click', () => {
        emailFile.value = null; // Limpa o input de arquivo
        updateFileName(null);
    });

    // Limpar o texto quando clicar na aba de arquivo
    fileTab.addEventListener('click', () => {
        emailText.value = '';
    });


    // Submissão do Formulário
    analysisForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Resetar UI
        setLoading(true);
        resultsDisplay.style.display = 'none';
        resultsPlaceholder.style.display = 'block';

        const formData = new FormData();
        const file = emailFile.files[0];
        const text = emailText.value;

        if (file) {
            formData.append('file', file);
        } else if (text) {
            formData.append('text', text);
        } else {
            displayError("Por favor, cole um texto ou envie um arquivo.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || `HTTP error! status: ${response.status}`);
            }
            
            displayResults(result);

        } catch (error) {
            console.error('Erro ao analisar:', error);
            displayError(error.message || "Não foi possível conectar à API.");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            buttonText.style.display = 'none';
            buttonSpinner.style.display = 'inline-block';
            analyzeButton.disabled = true;
        } else {
            buttonText.style.display = 'inline-block';
            buttonSpinner.style.display = 'none';
            analyzeButton.disabled = false;
        }
    }

    function displayResults(data) {
        const { classification, suggested_reply } = data;
        
        classificationBadge.textContent = classification;
        suggestedReply.textContent = suggested_reply || "Nenhuma ação necessária.";
        
        // Estilizar o badge
        if (classification.toLowerCase() === 'produtivo') {
            classificationBadge.className = 'badge rounded-pill fs-6 bg-primary';
        } else {
            classificationBadge.className = 'badge rounded-pill fs-6 bg-secondary';
        }
        
        resultsPlaceholder.style.display = 'none';
        resultsDisplay.style.display = 'block';
    }

    function displayError(message) {
        resultsDisplay.style.display = 'none';
        resultsPlaceholder.style.display = 'block';

        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const isDark = currentTheme === 'dark';

        const bgColor = isDark ? '#1e212d' : '#ffffff';
        const textColor = isDark ? '#e0e0e0' : '#333333';

        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: message,
            toast: true,                
            position: 'top-end',       
            showConfirmButton: false,   
            timer: 4000,                
            timerProgressBar: true,
            background: bgColor,        
            color: textColor,           
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });
    }

    copyButton.addEventListener('click', () => {
        const textToCopy = suggestedReply.textContent;
        
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const tooltip = bootstrap.Tooltip.getInstance(copyButton);
            copyButton.setAttribute('data-bs-original-title', 'Copiado!');
            tooltip.show();
            setTimeout(() => {
                copyButton.setAttribute('data-bs-original-title', 'Copiar');
                tooltip.hide();
            }, 2000);

        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
        document.body.removeChild(textArea);
    });

});