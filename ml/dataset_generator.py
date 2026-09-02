"""
KisanQueue ML - Synthetic Mandi Procurement Dataset Generator
Generates realistic agricultural procurement data representing Indian Mandis / APMC centres.
Used for training the Waiting-Time Prediction Machine Learning Model.
"""

import numpy as np
import pandas as pd
import os

CROPS = ["Paddy", "Wheat", "Mustard", "Cotton", "Maize", "Soybean", "Gram"]

CROP_BASE_INSPECTION_TIME = {
    "Paddy": 12.0,    # Moisture testing, grain sampling
    "Wheat": 9.0,     # Standard grain dockage check
    "Mustard": 11.0,  # Oil content & foreign matter check
    "Cotton": 18.0,   # High volume, staple length & moisture test
    "Maize": 10.0,    # Moisture & fungal check
    "Soybean": 13.0,  # Moisture, splits & foreign matter
    "Gram": 10.0      # Pulse quality check
}

def generate_mandi_dataset(n_samples=3500, random_seed=42):
    np.random.seed(random_seed)
    
    # 1. Farmers ahead (0 to 35)
    farmers_ahead = np.random.geometric(p=0.08, size=n_samples) - 1
    farmers_ahead = np.clip(farmers_ahead, 0, 45)
    
    # 2. Crop selection with realistic harvest probabilities
    crop_probs = [0.30, 0.25, 0.12, 0.10, 0.08, 0.08, 0.07]
    crop_types = np.random.choice(CROPS, size=n_samples, p=crop_probs)
    
    # 3. Quantity in quintals (Log-normal distribution representing small vs large farmers)
    quantities = np.random.lognormal(mean=3.2, sigma=0.6, size=n_samples)
    quantities = np.clip(quantities, 5.0, 250.0).round(1)
    
    # 4. Center Capacity (Weighbridges & Quality counters)
    weighing_counters = np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.2, 0.5, 0.25, 0.05])
    quality_counters = np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.25, 0.5, 0.2, 0.05])
    staff_count = weighing_counters + quality_counters + np.random.randint(1, 6, size=n_samples)
    
    # 5. Hour of day (Mandi operating hours 7 AM to 7 PM)
    hours = np.random.choice(range(7, 20), size=n_samples, p=[
        0.03, 0.08, 0.14, 0.16, 0.15, 0.12, 0.08, 0.07, 0.06, 0.05, 0.03, 0.02, 0.01
    ])
    
    # 6. Peak season factor (1 = peak procurement months)
    is_peak_season = np.random.choice([0, 1], size=n_samples, p=[0.35, 0.65])
    
    # 7. Recent average stage duration at center (minutes)
    avg_recent_stage_duration = np.random.normal(loc=14.0, scale=3.0, size=n_samples)
    avg_recent_stage_duration = np.clip(avg_recent_stage_duration, 7.0, 30.0).round(1)
    
    # 8. Calculate true waiting time based on multi-server queuing theory & domain dynamics
    # Effective service throughput per parallel counter
    base_inspection = np.array([CROP_BASE_INSPECTION_TIME[c] for c in crop_types])
    
    # Weighing duration scales mildly with quintal load
    weighing_duration = 4.0 + (quantities * 0.05) + np.random.normal(0, 1.0, size=n_samples)
    weighing_duration = np.clip(weighing_duration, 3.0, 20.0)
    
    total_service_per_farmer = (weighing_duration / weighing_counters) + (base_inspection / quality_counters)
    
    # Effective queue wait
    effective_throughput = (weighing_counters * 0.55) + (quality_counters * 0.45)
    queue_wait = (farmers_ahead * total_service_per_farmer * 0.85) / effective_throughput
    
    # Peak hour congestion factor (10am-1pm lunch/rush slowdown)
    rush_factor = np.where((hours >= 10) & (hours <= 13), 1.25, 1.0)
    peak_season_factor = np.where(is_peak_season == 1, 1.15, 0.95)
    
    # Own processing time before turn
    unloading_prep = 3.0 + np.random.exponential(scale=2.0, size=n_samples)
    
    # Total waiting time
    waiting_time = (queue_wait * rush_factor * peak_season_factor) + unloading_prep
    # Add realistic environmental variance
    noise = np.random.normal(0, 2.5, size=n_samples)
    waiting_time = np.clip(waiting_time + noise, 2.0, 360.0).round(1)
    
    df = pd.DataFrame({
        "farmers_ahead": farmers_ahead,
        "crop_type": crop_types,
        "quantity_quintals": quantities,
        "active_weighing_counters": weighing_counters,
        "active_quality_counters": quality_counters,
        "active_staff_count": staff_count,
        "avg_recent_stage_duration": avg_recent_stage_duration,
        "hour_of_day": hours,
        "is_peak_season": is_peak_season,
        "waiting_time_minutes": waiting_time
    })
    
    return df

if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    df = generate_mandi_dataset()
    csv_path = os.path.join(output_dir, "mandi_procurement_data.csv")
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} realistic procurement records -> {csv_path}")
    print(df.head())
