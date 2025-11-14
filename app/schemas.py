from pydantic import BaseModel

class EmailAnalysisResponse(BaseModel):
    classification: str
    suggested_reply: str
