"""Contrato común para las fuentes de datos."""

from pathlib import Path
from typing import Protocol

from app.services.data_loader import RawRow


class DataProvider(Protocol):
    """Interfaz mínima que debe cumplir cualquier proveedor de datos."""

    def available_variables(self) -> list[dict[str, str]]:
        """Devuelve las variables que el proveedor puede consultar."""

    def get_series(self, variable_id: str) -> list[RawRow]:
        """Obtiene filas en el formato original del proveedor."""


class CsvDataProvider:
    """Implementación reutilizable para datasets CSV locales."""

    def __init__(
        self,
        variables: list[dict[str, str]],
        files_by_variable: dict[str, Path],
    ) -> None:
        self._variables = variables
        self._files_by_variable = files_by_variable

    def available_variables(self) -> list[dict[str, str]]:
        return self._variables

    def get_series(self, variable_id: str) -> list[RawRow]:
        file_path = self._files_by_variable.get(variable_id)
        if file_path is None:
            raise KeyError(variable_id)

        # La lectura del formato CSV queda encapsulada en el proveedor.
        from app.services.data_loader import load_demo_series

        return load_demo_series(file_path)
