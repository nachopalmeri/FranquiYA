from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os
import requests
import logging
from database import get_db
from models.user import User
from schemas import WeatherData, WeatherForecast
from auth import get_current_active_user

router = APIRouter(prefix="/weather", tags=["weather"])

logger = logging.getLogger(__name__)

@router.get("", response_model=WeatherData)
def get_weather(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    api_key = os.getenv("OPENWEATHERMAP_API_KEY", "")
    
    lat = float(os.getenv("WEATHER_LAT", "-34.7222"))
    lon = float(os.getenv("WEATHER_LON", "-58.3945"))
    
    logger.info(f"API Key configured: {bool(api_key and api_key not in ['demo', 'demo_key', ''])}")
    logger.info(f"Coordinates: lat={lat}, lon={lon}")
    
    if not api_key or api_key in ["demo", "demo_key", ""]:
        logger.warning("No API key configured, returning demo weather")
        return WeatherData(
            temp=28,
            feels_like=30,
            condition="Clear",
            description="Cielo despejado (demo - sin API key)",
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
        url = "http://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
            "lang": "es"
        }
        logger.info(f"Fetching weather for coordinates lat={lat}, lon={lon}")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            logger.error(f"Weather API error: {response.status_code} - {response.text}")
            return WeatherData(
                temp=25,
                feels_like=26,
                condition="Clear",
                description=f"Error API: {response.status_code}",
                icon="01d",
                humidity=50,
                wind_speed=10,
                forecast=[]
            )
        
        data = response.json()
        city_name = data.get("name", "Lanús")
        logger.info(f"Weather data received: {city_name} - {data.get('weather', [{}])[0].get('description', 'N/A')}")
        
        forecast_url = "http://api.openweathermap.org/data/2.5/forecast"
        forecast_response = requests.get(forecast_url, params=params, timeout=10)
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
    except requests.exceptions.Timeout:
        logger.error("Weather API timeout")
        return WeatherData(
            temp=25,
            feels_like=26,
            condition="Clear",
            description="Timeout - Clima no disponible",
            icon="01d",
            humidity=50,
            wind_speed=10,
            forecast=[]
        )
    except Exception as e:
        logger.error(f"Weather API error: {str(e)}")
        return WeatherData(
            temp=25,
            feels_like=26,
            condition="Clear",
            description=f"Error: {str(e)[:50]}",
            icon="01d",
            humidity=50,
            wind_speed=10,
            forecast=[]
        )

@router.get("/debug")
def debug_weather_config():
    api_key = os.getenv("OPENWEATHERMAP_API_KEY", "")
    lat = os.getenv("WEATHER_LAT", "-34.7222")
    lon = os.getenv("WEATHER_LON", "-58.3945")
    
    return {
        "api_key_configured": bool(api_key and api_key not in ["", "demo", "demo_key"]),
        "api_key_length": len(api_key) if api_key else 0,
        "api_key_prefix": api_key[:8] + "..." if api_key and len(api_key) > 8 else "N/A",
        "coordinates": {
            "lat": lat,
            "lon": lon,
            "location": "Lanús, Buenos Aires, Argentina"
        }
    }
