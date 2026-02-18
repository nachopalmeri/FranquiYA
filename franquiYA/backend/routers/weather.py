from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os
import requests
from database import get_db
from models.user import User
from schemas import WeatherData, WeatherForecast
from auth import get_current_active_user

router = APIRouter(prefix="/weather", tags=["weather"])

OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY", "demo")
WEATHER_CITY = os.getenv("WEATHER_CITY", "Lanus,AR")

@router.get("", response_model=WeatherData)
def get_weather(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if OPENWEATHERMAP_API_KEY == "demo":
        return WeatherData(
            temp=28,
            feels_like=30,
            condition="Clear",
            description="Cielo despejado",
            icon="01d",
            humidity=45,
            wind_speed=12,
            forecast=[
                WeatherForecast(
                    dt=1700000000,
                    temp=32,
                    temp_min=25,
                    temp_max=33,
                    condition="Clear",
                    icon="01d"
                )
            ]
        )
    
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": WEATHER_CITY,
            "appid": OPENWEATHERMAP_API_KEY,
            "units": "metric",
            "lang": "es"
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        forecast_url = f"http://api.openweathermap.org/data/2.5/forecast"
        forecast_response = requests.get(forecast_url, params=params, timeout=5)
        forecast_data = forecast_response.json()
        
        forecast_list = []
        for item in forecast_data.get("list", [])[:8]:
            forecast_list.append(WeatherForecast(
                dt=item["dt"],
                temp=item["main"]["temp"],
                temp_min=item["main"]["temp_min"],
                temp_max=item["main"]["temp_max"],
                condition=item["weather"][0]["main"],
                icon=item["weather"][0]["icon"]
            ))
        
        return WeatherData(
            temp=data["main"]["temp"],
            feels_like=data["main"]["feels_like"],
            condition=data["weather"][0]["main"],
            description=data["weather"][0]["description"],
            icon=data["weather"][0]["icon"],
            humidity=data["main"]["humidity"],
            wind_speed=data["wind"]["speed"],
            forecast=forecast_list
        )
    except Exception:
        return WeatherData(
            temp=25,
            feels_like=26,
            condition="Clear",
            description="Clima no disponible",
            icon="01d",
            humidity=50,
            wind_speed=10,
            forecast=[]
        )
