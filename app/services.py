import os
import io
import json
import string 
import nltk   
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords      
from nltk.stem import RSLPStemmer    
import pdfplumber
import google.generativeai as genai
from fastapi import UploadFile, HTTPException

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('stemmers/rslp')
except LookupError:
    nltk.download('rslp', quiet=True)

# Importar a configuração
from .config import GEMINI_API_KEY

# --- Configuração do Gemini ---
genai.configure(api_key=GEMINI_API_KEY)

# Esquema JSON para a resposta do Gemini
GEMINI_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "classification": {
            "type": "STRING",
            "enum": ["Produtivo", "Improdutivo"],
        },
        "suggested_reply": {"type": "STRING"},
    },
    "required": ["classification", "suggested_reply"],
}

# Prompt do sistema para o Gemini
SYSTEM_PROMPT = """
Você é um assistente de IA especialista em classificar e-mails para uma equipe interna da B3 (Brasil, Bolsa, Balcão).
Seu objetivo é analisar o e-mail fornecido e classificá-lo estritamente como 'Produtivo' ou 'Improdutivo'.

- 'Produtivo': E-mails que requerem uma ação ou resposta específica da B3. Exemplos: consultas de participantes (corretoras) sobre regras operacionais, solicitações de suporte técnico (ex: falha de conexão com o PUMA), dúvidas de empresas listadas sobre envio de fatos relevantes, pedidos de dados de mercado (market data), ou consultas sobre processos de liquidação e custódia.
- 'Improdutivo': E-mails que não necessitam de uma ação imediata da equipe. Exemplos: newsletters genéricas de mercado (que não sejam comunicados oficiais), spam de fornecedores de software, mensagens de felicitações/agradecimentos, convites para webinars externos não solicitados.

Com base na classificação, gere uma sugestão de resposta curta, profissional, em português, e adequada ao tom institucional da B3.
Se for 'Improdutivo', a resposta pode ser vazia ou um simples "Nenhuma ação necessária.".

Retorne sua análise no formato JSON solicitado.
"""

# Modelo Gemini com configuração para resposta JSON
model = genai.GenerativeModel(
    "gemini-2.5-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=GEMINI_RESPONSE_SCHEMA,
    ),
    system_instruction=SYSTEM_PROMPT,
)


def preprocess_text(text: str) -> str:
    """
    Executa o pré-processamento de NLP clássico no texto.
    1. Tokeniza (divide em palavras)
    2. Remove pontuação, números e stop words (palavras comuns)
    3. Aplica Stemming (reduz palavras ao seu radical)
    """
    
    text = text.lower()
    
    # 1. Tokenização
    tokens = word_tokenize(text, language='portuguese')
    
    # 2. Carregar listas de remoção
    stop_words = set(stopwords.words('portuguese'))

    punctuation = set(string.punctuation)
    
    # 3. Limpeza
    processed_tokens = []
    for token in tokens:
        if token not in stop_words and token not in punctuation and not token.isnumeric():
            processed_tokens.append(token)
            
    # 4. Stemming
    stemmer = RSLPStemmer()
    print(processed_tokens)
    stemmed_tokens = [stemmer.stem(token) for token in processed_tokens]
    print(stemmed_tokens)
    
    return " ".join(stemmed_tokens)


async def get_analysis(content: str) -> dict:
    """Chama a API do Gemini para análise."""
    
    # Processa o conteúdo bruto
    processed_content = preprocess_text(content)

    try:
        response = await model.generate_content_async([processed_content])
        
        analysis_data = json.loads(response.text)
        
        if "classification" not in analysis_data or "suggested_reply" not in analysis_data:
            raise ValueError("Resposta da IA está incompleta.")
            
        return analysis_data
        
    except Exception as e:
        print(f"Erro na chamada do Gemini: {e}")
        if hasattr(response, 'prompt_feedback'):
            print(f"Prompt Feedback: {response.prompt_feedback}")
        if hasattr(response, 'candidates'):
            print(f"Candidates: {response.candidates}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar com a IA: {e}")

async def extract_text(file: UploadFile) -> str:
    """Extrai texto de .txt ou .pdf."""
    content = ""
    if file.content_type == "text/plain":
        file_content = await file.read()
        content = file_content.decode("utf-8")
    elif file.content_type == "application/pdf":
        file_bytes = await file.read()
        try:
            with io.BytesIO(file_bytes) as pdf_file:
                with pdfplumber.open(pdf_file) as pdf:
                    for page in pdf.pages:
                        content += page.extract_text() or ""
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro ao ler PDF: {e}")
    else:
        raise HTTPException(status_code=415, detail="Formato de arquivo não suportado. Use .txt ou .pdf.")
    
    return content