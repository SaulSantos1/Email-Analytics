## Como Executar

### 1. Pré-requisitos

* **Python 3.10 ou superior:** Verifique com `python --version`.
* **Chave da API Google Gemini:**
    1.  Acesse o [Google AI Studio](https://aistudio.google.com/).
    2.  Faça login e clique em "Get API key".
    3.  Crie uma nova chave de API e copie-a.

### 2. Configuração do Ambiente

1.  **Clone este repositório:**
    ```sh
    https://github.com/SaulSantos1/Email-Analytics.git
    cd Email-Analytics
    ```

2.  **Crie e ative um ambiente virtual:**
    ```sh
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Instale as dependências:**
    ```sh
    pip install -r requirements.txt
    ```

4.  **Configure sua chave de API:**
    * Crie um arquivo chamado de `.env`.
    * Abra o arquivo `.env` e cole sua chave da API:
        ```
        GEMINI_API_KEY="SUA_CHAVE_API_DO_GEMINI_AQUI"
        ```

### 3. Executando a Aplicação

Com o ambiente virtual ativado, execute o comando para iniciar o servidor de desenvolvimento:

```sh
fastapi dev main.py
```