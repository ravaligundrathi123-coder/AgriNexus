"""
KisanQueue ML - Waiting Time Model Training
Trains a Random Forest Regressor pipeline on agricultural procurement data.
Exports model artifact, metrics, and feature importance.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from dataset_generator import generate_mandi_dataset

def train_waiting_time_model():
    print("Generating training dataset...")
    df = generate_mandi_dataset(n_samples=4000, random_seed=42)
    
    feature_cols = [
        "farmers_ahead",
        "crop_type",
        "quantity_quintals",
        "active_weighing_counters",
        "active_quality_counters",
        "active_staff_count",
        "avg_recent_stage_duration",
        "hour_of_day",
        "is_peak_season"
    ]
    
    categorical_cols = ["crop_type"]
    numeric_cols = [c for c in feature_cols if c not in categorical_cols]
    
    X = df[feature_cols]
    y = df["waiting_time_minutes"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols)
        ]
    )
    
    # Regressor
    rf = RandomForestRegressor(
        n_estimators=120,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", rf)
    ])
    
    print("Training Random Forest Regressor pipeline...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Evaluation Metrics:")
    print(f"  RMSE: {rmse:.2f} minutes")
    print(f"  MAE:  {mae:.2f} minutes")
    print(f"  R2:   {r2:.4f}")
    
    # Save Model Artifact
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "waiting_time_model.joblib")
    
    joblib.dump(pipeline, model_path)
    print(f"Model successfully saved to: {model_path}")
    
    # Save metadata & feature importance
    cat_encoder = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    encoded_cat_features = list(cat_encoder.get_feature_names_out(categorical_cols))
    all_feature_names = numeric_cols + encoded_cat_features
    
    importances = pipeline.named_steps["regressor"].feature_importances_
    feature_importance_dict = {
        name: round(float(imp), 4) for name, imp in zip(all_feature_names, importances)
    }
    # Sort by importance
    sorted_importances = dict(sorted(feature_importance_dict.items(), key=lambda item: item[1], reverse=True))
    
    metadata = {
        "model_type": "RandomForestRegressor",
        "n_estimators": 120,
        "metrics": {
            "rmse_minutes": round(rmse, 2),
            "mae_minutes": round(mae, 2),
            "r2_score": round(r2, 4)
        },
        "feature_importances": sorted_importances,
        "feature_cols": feature_cols,
        "dataset_size": len(df)
    }
    
    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata saved to: {metadata_path}")
    
    return pipeline, metadata

if __name__ == "__main__":
    train_waiting_time_model()
