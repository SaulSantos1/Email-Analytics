from fastapi import APIRouter, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse

from .schemas import EmailAnalysisResponse
from . import services

router = APIRouter()


@router.post("/analyze", response_model=EmailAnalysisResponse)
async def analyze_email(
    text: str | None = Form(None), 
    file: UploadFile | None = Form(None)
):
    """
    Endpoint principal para analisar e-mails.
    Recebe texto direto ou um arquivo (.txt, .pdf).
    """
    email_content = ""

    if not text and not file:
        raise HTTPException(status_code=400, detail="Nenhum texto ou arquivo enviado.")

    if file:
        # Chama a função do módulo de serviços
        email_content = await services.extract_text(file)
    elif text:
        email_content = text

    if not email_content.strip():
        raise HTTPException(status_code=400, detail="O conteúdo do e-mail está vazio.")

    # Chama a função de análise do módulo de serviços
    analysis_result = await services.get_analysis(email_content)

    return JSONResponse(content=analysis_result)