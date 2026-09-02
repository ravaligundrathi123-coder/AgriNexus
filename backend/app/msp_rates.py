"""
Government of India - Minimum Support Prices (MSP) Reference Data
Used for automatic payout and DBT calculation upon procurement acceptance.
"""

MSP_RATES = {
    "Paddy": {
        "Standard": 2300.0,
        "Grade A": 2320.0,
        "Common": 2300.0
    },
    "Wheat": {
        "Standard": 2275.0,
        "Sharbati": 2550.0
    },
    "Mustard": {
        "Standard": 5650.0
    },
    "Cotton": {
        "Standard": 7121.0,
        "Long Staple": 7521.0
    },
    "Maize": {
        "Standard": 2090.0
    },
    "Soybean": {
        "Standard": 4600.0,
        "Yellow": 4600.0
    },
    "Gram": {
        "Standard": 5440.0
    }
}

def get_msp_rate(crop_type: str, variety: str = "Standard") -> float:
    crop_dict = MSP_RATES.get(crop_type, {})
    if not crop_dict:
        # Default fallback average
        return 2300.0
    return crop_dict.get(variety, list(crop_dict.values())[0])
