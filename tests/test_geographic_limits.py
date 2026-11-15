from datetime import date
from unittest.mock import patch

import pytest

from app.catalog import VARIABLES
from app.schemas.analysis import RegionInfo
from app.services.providers.nasa_power import NasaPowerProvider


@pytest.mark.parametrize("height,width", [(1.99, 5), (5, 1.99), (10.01, 5), (5, 10.01)])
def test_invalid_size_never_reaches_power(height, width):
    region = RegionInfo(id="test", name="test", type="bbox",
                        south=0, west=0, north=height, east=width)
    with patch("app.services.providers.nasa_power.httpx.get") as get:
        with pytest.raises(ValueError):
            NasaPowerProvider().get_series(
                VARIABLES["temperature"], region, date(2020, 1, 1), date(2020, 12, 31)
            )
    get.assert_not_called()


@pytest.mark.parametrize("size", [2, 10])
def test_boundary_sizes_are_accepted(size, tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.providers.nasa_power.CACHE_DIR", tmp_path)
    region = RegionInfo(id="test", name="test", type="bbox",
                        south=0, west=0, north=size, east=size)
    with patch("app.services.providers.nasa_power.httpx.get") as get:
        get.return_value.json.return_value = {
            "features": [{"properties": {"parameter": {"T2M": {"202001": 20}}}}]
        }
        series = NasaPowerProvider().get_series(
            VARIABLES["temperature"], region, date(2020, 1, 1), date(2020, 12, 31)
        )
    get.assert_called_once()
    assert series[0].value == 20
