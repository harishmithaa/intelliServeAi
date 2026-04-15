import pandas as pd
import numpy as np
import random

# Number of samples
n = 500

# Possible values
days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
menus = ['Meals', 'Biryani', 'Pongal', 'Fried Rice', 'Chapati']
weather = ['Sunny', 'Rainy', 'Cloudy']

data = []

for i in range(n):
    day = random.choice(days)
    menu = random.choice(menus)
    weather_condition = random.choice(weather)
    
    # Simulate footfall
    base_footfall = np.random.randint(200, 600)
    
    # Adjust based on day
    if day in ['Sat', 'Sun']:
        base_footfall -= np.random.randint(50, 150)
    
    # Adjust based on menu popularity
    if menu == 'Biryani':
        base_footfall += np.random.randint(50, 100)
    elif menu == 'Pongal':
        base_footfall -= np.random.randint(20, 60)
    
    # Adjust based on weather
    if weather_condition == 'Rainy':
        base_footfall -= np.random.randint(30, 80)
    
    footfall = max(100, base_footfall)
    
    # Food consumed ~ 85%–95% of footfall
    consumed = int(footfall * np.random.uniform(0.85, 0.95))
    
    # Add safety buffer
    prepared = int(consumed * np.random.uniform(1.05, 1.15))
    
    # Waste
    wasted = prepared - consumed

    data.append([
        day, menu, weather_condition,
        footfall, prepared, consumed, wasted
    ])

# Create DataFrame
df = pd.DataFrame(data, columns=[
    'day', 'menu', 'weather',
    'footfall', 'prepared', 'consed', 'wasted'
])

# Save to CSV
df.to_csv("synthetic_food_data.csv", index=False)

print("Dataset generated successfully!")
print(df.head())