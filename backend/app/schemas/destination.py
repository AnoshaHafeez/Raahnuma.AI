from pydantic import BaseModel


class DestinationOut(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    description: str
    known_hazards: str

    model_config = {"from_attributes": True}
