import importlib
import os


def resource_filename(package_or_requirement, resource_name):
    module = importlib.import_module(package_or_requirement)
    package_path = list(getattr(module, "__path__", []))

    if package_path:
        return os.path.join(package_path[0], resource_name)

    module_file = getattr(module, "__file__", None)
    if module_file:
        return os.path.join(os.path.dirname(module_file), resource_name)

    raise FileNotFoundError(
        f"Unable to resolve resource '{resource_name}' for package '{package_or_requirement}'."
    )
