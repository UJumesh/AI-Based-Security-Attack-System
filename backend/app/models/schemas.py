"""Strict request contracts shared by API controllers and workers."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, StrictFloat, StrictInt

class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    source: Literal['manual_sample', 'offline_flow'] = 'manual_sample'
    features: dict[str, StrictInt | StrictFloat] = Field(..., max_length=500, description='All numeric features required by the trained model.')

class ReplayRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    limit: int = Field(20, ge=1, le=100)
    interval_seconds: float = Field(1, ge=0.2, le=10, allow_inf_nan=False)
