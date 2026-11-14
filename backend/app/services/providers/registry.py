"""Provider construction and variable capability checks."""

from app.services.providers.demo_provider import DemoProvider
from app.services.providers.nasa_power import NasaPowerProvider


PROVIDERS = {
    "demo": DemoProvider(),
    "nasa-power": NasaPowerProvider(),
}


def get_provider(provider_id: str):
    try:
        return PROVIDERS[provider_id]
    except KeyError as error:
        raise ValueError(f"Unknown data provider: {provider_id}") from error
