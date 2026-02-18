from pydantic import BaseModel
from typing import Optional, List

class WeatherForecast(BaseModel):
    dt: int
    temp: float
    temp_min: float
    temp_max: float
    condition: str
    icon: str

class WeatherData(BaseModel):
    temp: float
    feels_like: float
    condition: str
    description: str
    icon: str
    humidity: int
    wind_speed: float
    forecast: Optional[List[WeatherForecast]] = None
