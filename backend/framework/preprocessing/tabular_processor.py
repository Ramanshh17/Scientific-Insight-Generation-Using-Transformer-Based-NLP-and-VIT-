# src/preprocessing/tabular_processor.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from typing import Tuple, Optional


class TabularProcessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='mean')
        self.label_encoders = {}
        self.feature_names = []

    def analyze(self, df: pd.DataFrame) -> dict:
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(include=['object']).columns.tolist()
        return {
            'rows': df.shape[0],
            'cols': df.shape[1],
            'numeric_cols': numeric_cols,
            'categorical_cols': cat_cols,
            'missing': int(df.isnull().sum().sum()),
            'missing_pct': round(df.isnull().mean().mean() * 100, 2)
        }

    def preprocess(self, df: pd.DataFrame,
                   target_col: Optional[str] = None) -> Tuple:
        df = df.copy()
        analysis = self.analyze(df)

        y = None
        if target_col and target_col in df.columns:
            y = df[target_col].values
            df = df.drop(columns=[target_col])

        cat_cols = df.select_dtypes(include=['object']).columns.tolist()
        for col in cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if num_cols:
            df[num_cols] = self.imputer.fit_transform(df[num_cols])
            df[num_cols] = self.scaler.fit_transform(df[num_cols])

        self.feature_names = df.columns.tolist()
        return df, y, analysis

    def get_summary(self, df: pd.DataFrame) -> str:
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        summary = f"Dataset: {df.shape[0]} samples, {df.shape[1]} features. "
        if num_cols:
            for col in num_cols[:3]:
                m = df[col].mean()
                s = df[col].std()
                summary += f"{col}: {m:.2f}±{s:.2f}. "
        return summary

    def create_sample_data(self, n: int = 100) -> pd.DataFrame:
        np.random.seed(42)
        return pd.DataFrame({
            'temperature': np.random.normal(25, 8, n),
            'pressure': np.random.exponential(1.5, n),
            'reaction_time': np.random.uniform(0.5, 5.0, n),
            'catalyst_conc': np.random.gamma(2, 0.5, n),
            'pH': np.random.uniform(3, 11, n),
            'stirring_speed': np.random.choice([100, 200, 300, 400], n),
            'solvent': np.random.choice(['water', 'ethanol', 'methanol'], n),
            'yield': np.random.normal(72, 18, n).clip(0, 100),
            'purity': (np.random.beta(8, 2, n) * 100).clip(0, 100)
        })