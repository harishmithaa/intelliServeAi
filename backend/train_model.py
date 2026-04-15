import os
import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# Set random seed for reproducibility
np.random.seed(42)

def generate_dummy_data(n_samples=1000):
    """Generate realistic dummy data for food demand prediction."""
    # Possible values
    menus = ['Meals (Lunch)', 'Biryani (Dinner)', 'Breakfast Items', 'Snacks']
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    weathers = ['Sunny / Normal', 'Rainy', 'Cold / Winter', 'Extreme Heat']
    
    data = []
    
    for _ in range(n_samples):
        menu = np.random.choice(menus)
        day = np.random.choice(days)
        weather = np.random.choice(weathers)
        
        # Base expected footfall, higher during middle of week, lower on weekends
        base_footfall = np.random.normal(500, 50)
        if day in ['Saturday', 'Sunday']:
            base_footfall *= 0.6
            
        # Footfall variability
        footfall = int(max(100, min(1000, np.random.normal(base_footfall, 100))))
        
        # Consumption base logic
        # Depends heavily on footfall, menu popularity, and weather
        consumption_ratio = 1.0
        
        # Menu preference adjustments
        if menu == 'Biryani (Dinner)':
            consumption_ratio *= 1.2 # Highly consumed
        elif menu == 'Snacks':
            consumption_ratio *= 0.8
            
        # Weather adjustments
        if weather == 'Rainy':
            consumption_ratio *= 0.9 # Less people come out, somewhat less consumption per person
        elif weather == 'Extreme Heat':
            if menu in ['Meals (Lunch)', 'Biryani (Dinner)']:
                consumption_ratio *= 0.85 # Less heavy meals in heat
                
        # Calculate actual consumed food with some noise
        # Assumption: 1 unit of food per person generally
        consumed = int(footfall * consumption_ratio * np.random.normal(1.0, 0.05))
        
        data.append({
            'menu': menu,
            'day': day,
            'weather': weather,
            'footfall': footfall,
            'consumed': consumed
        })
        
    df = pd.DataFrame(data)
    return df

def preprocess_and_train():
    print("Generating dummy data...")
    df = generate_dummy_data(2000)
    
    print("Data sample:")
    print(df.head())
    
    # One-hot encoding for categorical variables
    categorical_cols = ['menu', 'day', 'weather']
    
    # We will use pandas get_dummies but we need to save the columns 
    # so we know what features the model expects during inference.
    df_encoded = pd.get_dummies(df, columns=categorical_cols)
    
    X = df_encoded.drop('consumed', axis=1)
    y = df_encoded['consumed']
    
    # Get feature columns
    feature_columns = list(X.columns)
    
    print(f"\nFeatures created ({len(feature_columns)}):")
    for col in feature_columns:
        print(f" - {col}")
        
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("\nTraining XGBoost model...")
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    print(f"\nModel RMSE: {rmse:.2f} meals")
    
    # Save model and feature columns
    os.makedirs('models', exist_ok=True)
    
    model_data = {
        'model': model,
        'feature_columns': feature_columns
    }
    
    with open('models/model.pkl', 'wb') as f:
        pickle.dump(model_data, f)
        
    print("\nModel saved to 'models/model.pkl'")

if __name__ == "__main__":
    preprocess_and_train()
