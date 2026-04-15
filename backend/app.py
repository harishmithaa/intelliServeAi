import os
import pickle
import pandas as pd  # type: ignore
from flask import Flask, request, jsonify  # type: ignore
from flask_cors import CORS  # type: ignore
from pymongo import MongoClient  # type: ignore
from datetime import datetime
import json
import urllib.request
import urllib.parse
import math
import random
from bson.json_util import dumps  # type: ignore
from bson.objectid import ObjectId  # type: ignore
import typing

app = Flask(__name__)
# Enable CORS for the frontend React application
CORS(app)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['intelliserve']
food_data_collection = db['food_data']
ngos_collection = db['ngos']

# Internal state for model
model: typing.Any = None
feature_columns: typing.Optional[typing.List[str]] = None

def load_model():
    global model, feature_columns
    try:
        with open('models/model.pkl', 'rb') as f:
            model_data = pickle.load(f)
            model = model_data['model']
            feature_columns = model_data['feature_columns']
            print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None or feature_columns is None:
        return jsonify({"error": "Model not loaded"}), 500
        
    data = request.json
    
    try:
        # Extract inputs
        menu = data.get('menuType', 'Meals (Lunch)')
        day = data.get('dayOfWeek', 'Monday')
        weather = data.get('weather', 'Sunny / Normal')
        footfall = int(data.get('footfall', 500))
        
        # Prepare input dataframe
        input_data = pd.DataFrame([{
            'menu': menu,
            'day': day,
            'weather': weather,
            'footfall': footfall
        }])
        
        # One-hot encode using the exact columns from training
        input_encoded = pd.get_dummies(input_data, columns=['menu', 'day', 'weather'])
        
        # Realign columns to match training features exactly
        current_features = feature_columns or []
        for col in current_features:
            if col not in input_encoded.columns:
                input_encoded[col] = 0
                
        # Ensure order matches
        input_encoded = input_encoded[current_features]
        
        # Make prediction
        if model is None:
            raise ValueError("Model not initialized")
        predicted = float(model.predict(input_encoded)[0])
        # Add 10% safety buffer
        recommended = predicted * 1.1
        
        # For realistic representation, round to nearest integer
        predicted = int(round(predicted))
        recommended = int(round(recommended))
        
        return jsonify({
            "predicted_consumption": predicted,
            "recommended_preparation": recommended,
            "confidence": 94  # Static for demo purposes
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/surplus', methods=['POST'])
def calculate_surplus():
    data = request.json
    try:
        prepared = float(data.get('prepared', 0))
        consumed = float(data.get('consumed', 0))
        
        diff = prepared - consumed
        surplus = float(diff if diff > 0 else 0.0)
        
        if prepared > 0:
            surplus_percentage = (surplus / prepared) * 100
        else:
            surplus_percentage = 0
            
        if surplus_percentage < 10:
            waste_level = "Low"
            action = "Clear"
            is_high = False
        elif surplus_percentage <= 25:
            waste_level = "Medium"
            action = "Monitor"
            is_high = False
        else:
            waste_level = "High"
            action = "Action Req."
            is_high = True
            
        return jsonify({
            "prepared": int(prepared),
            "consumed": int(consumed),
            "surplus": int(surplus),
            "surplus_percentage": float(f"{surplus_percentage:.2f}"),
            "waste_level": waste_level,
            "action": action,
            "is_high": is_high
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def haversine(lat1, lon1, lat2, lon2):
    R = 6371 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

@app.route('/api/find-ngos', methods=['POST'])
def find_ngos():
    data = request.json
    lat = data.get('lat')
    lon = data.get('lon')
    radius = data.get('radius', 15000) # 15km
    
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json];
    (
      node["office"="ngo"](around:{radius},{lat},{lon});
      node["office"="charity"](around:{radius},{lat},{lon});
      node["amenity"="social_facility"](around:{radius},{lat},{lon});
    );
    out center 15;
    """
    
    try:
        req = urllib.request.Request(overpass_url, data=overpass_query.encode('utf-8'))
        # Overpass requires a User-Agent to prevent 403 blocks occasionally
        req.add_header('User-Agent', 'IntelliServe-AI/1.0')
        response = urllib.request.urlopen(req, timeout=10)
        result = json.loads(response.read().decode('utf-8'))
        
        ngos = []
        for idx, element in enumerate(result.get('elements', [])):
            elat = element.get('lat')
            elon = element.get('lon')
            tags = element.get('tags', {})
            
            # Identify name
            name = tags.get('name')
            if not name:
                name = f"Community Support Center {idx+1}"
                
            distance = haversine(lat, lon, elat, elon)
            
            # Deterministic simulation of capacity, fleet, and time based on ID
            random.seed(element.get('id', idx))
            capacity = random.randint(30, 250)
            time_mins = int(distance * 3) + random.randint(2, 8)
            vehicles = ['Van', 'Large Vehicle', 'Truck', 'Mini-Van']
            phone = f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            
            ngos.append({
                "id": element.get('id', idx),
                "name": name,
                "phone": phone,
                "distance": f"{distance:.1f} km",
                "time": f"{time_mins} mins",
                "capacity": capacity,
                "type": random.choice(vehicles),
                "lat": elat,
                "lon": elon
            })
            
        # Fallback if no real NGOs are mapped in their 15km area
        if not ngos:
            ngos = [
                {"id": 101, "name": "Regional FoodBank (Simulated)", "phone": "+1-555-829-1021", "distance": "5.2 km", "time": "15 mins", "capacity": 150, "type": "Truck", "lat": lat+0.04, "lon": lon+0.04},
                {"id": 102, "name": "City Relief Partners (Simulated)", "phone": "+1-555-772-9011", "distance": "8.1 km", "time": "22 mins", "capacity": 80, "type": "Van", "lat": lat-0.06, "lon": lon+0.02}
            ]
            
        return jsonify({"ngos": ngos})
    except Exception as e:
        print(f"Overpass Error: {e}")
        # Send back a fallback just so the UI doesn't break
        fallback = [{"id": 999, "name": "Fallback NGO", "distance": "4.0 km", "time": "12 mins", "capacity": 100, "type": "Van"}]
        return jsonify({"ngos": fallback, "error": str(e)})

@app.route('/api/ngo-match', methods=['POST'])
def ngo_match():
    data = request.json
    try:
        surplus_quantity = float(data.get('surplus_quantity', 0))
        ngos = data.get('ngos', [])
        
        if not ngos:
            return jsonify({"error": "No NGOs provided"}), 400
            
        best_match = None
        highest_score = -1
        
        for ngo in ngos:
            # Parse distance (e.g., "2.1 km" -> 2.1)
            dist_str = ngo.get('distance', '10 km').replace(' km', '')
            try:
                distance = float(dist_str)
            except ValueError:
                distance = 10.0
                
            capacity = float(ngo.get('capacity', 0))
            
            # Prevent division by zero
            if distance <= 0:
                distance = 0.1
                
            # Score formula: capacity*0.6 + (1/distance)*0.4
            # We normalize capacity roughly if we want it to balance, 
            # but simple application of formula from prompt:
            score = (capacity * 0.6) + ((1.0 / distance) * 0.4)
            
            # Make sure NGO can hold the load (or at least penalize if not)
            if capacity < surplus_quantity:
                score *= 0.5 # Penalty for not being able to take everything
                
            ngo['match_score'] = score
            
            if score > highest_score:
                highest_score = score
                best_match = ngo
                
        return jsonify({
            "selected_ngo": best_match,
            "all_scores": ngos
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/save-data', methods=['POST'])
def save_data():
    data = request.json
    try:
        record = {
            "date": datetime.now(),
            "menu": data.get('menu'),
            "day": data.get('day'),
            "weather": data.get('weather'),
            "footfall": data.get('footfall'),
            "predicted": data.get('predicted'),
            "prepared": data.get('prepared'),
            "consumed": data.get('consumed'),
            "surplus": data.get('surplus')
        }
        
        result = food_data_collection.insert_one(record)
        return jsonify({
            "status": "success", 
            "inserted_id": str(result.inserted_id)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # For simplicity, returning the latest 7 records simulating days
        records = list(food_data_collection.find().sort("date", -1).limit(7))
        records.reverse() # chronological order
        
        lineChartData = []
        for r in records:
            day_name = r.get('day', '')[:3] if r.get('day') else 'Day'
            lineChartData.append({
                "name": day_name,
                "predicted": r.get('predicted', 0),
                "actual": r.get('consumed', 0)
            })
            
        # Get surplus per menu (aggregation)
        pipeline = [
            {"$group": {"_id": "$menu", "total_waste": {"$sum": "$surplus"}}}
        ]
        agg_result = list(food_data_collection.aggregate(pipeline))
        
        barChartData = []
        for item in agg_result:
            # Map "Meals (Lunch)" -> "Meals" for chart brevity
            name = str(item['_id']).split(' ')[0]
            barChartData.append({
                "name": name,
                "waste": item['total_waste']
            })
            
        # Get latest day's stats
        latest = records[-1] if records else {}
        stats = {
            "predicted": latest.get('predicted', 0),
            "prepared": latest.get('prepared', 0),
            "consumed": latest.get('consumed', 0),
            "surplus": latest.get('surplus', 0)
        }
            
        return jsonify({
            "lineChartData": lineChartData,
            "barChartData": barChartData,
            "latestStats": stats
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/surplus-data', methods=['GET'])
def get_surplus_data():
    try:
        # Daywise filter
        day_filter = request.args.get('day')
        query = {}
        if day_filter and day_filter != 'All':
            query['day'] = day_filter
            
        records = list(food_data_collection.find(query).sort("date", -1).limit(10))
        
        response_data = []
        for idx, r in enumerate(records):
            prepared = r.get('prepared', 0)
            consumed = r.get('consumed', 0)
            surplus = r.get('surplus', 0)
            delivered = r.get('delivered', 0)
            
            # Simple threshold for high risk
            is_high = surplus > 0 and (surplus/prepared) > 0.25 if prepared > 0 else False
            
            response_data.append({
                "id": str(r.get('_id', idx)),
                "menu": r.get('menu', 'Unknown'),
                "prepared": prepared,
                "consumed": consumed,
                "surplus": surplus,
                "delivered": delivered,
                "isHigh": is_high,
                "date": r.get('date', datetime.now()).isoformat() if isinstance(r.get('date', datetime.now()), datetime) else str(r.get('date', datetime.now()))
            })
            
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mark-delivered/<record_id>', methods=['POST'])
def mark_delivered(record_id):
    try:
        record = food_data_collection.find_one({"_id": ObjectId(record_id)})
        if not record:
            return jsonify({"error": "Record not found"}), 404
            
        surplus_amt = record.get('surplus', 0)
        delivered_amt = record.get('delivered', 0)
        
        # Move surplus to delivered
        new_delivered = delivered_amt + surplus_amt
        
        food_data_collection.update_one(
            {"_id": ObjectId(record_id)},
            {"$set": {"surplus": 0, "delivered": new_delivered}}
        )
        return jsonify({"success": True, "delivered_amount": new_delivered})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Initialize Model
load_model()

if __name__ == '__main__':
    # Initialize initial dummy data if MongoDB is empty
    try:
        # Test connection quickly
        client.admin.command('ping')
        if food_data_collection.count_documents({}) == 0:
            print("MongoDB is empty, inserting some dummy historical data...")
            dummies = [
                {"date": datetime.now(), "menu": "Meals (Lunch)", "day": "Monday", "weather": "Sunny", "footfall": 500, "predicted": 450, "prepared": 500, "consumed": 440, "surplus": 60},
                {"date": datetime.now(), "menu": "Biryani (Dinner)", "day": "Tuesday", "weather": "Sunny", "footfall": 600, "predicted": 480, "prepared": 520, "consumed": 485, "surplus": 35},
                {"date": datetime.now(), "menu": "Snacks", "day": "Wednesday", "weather": "Rainy", "footfall": 400, "predicted": 500, "prepared": 500, "consumed": 490, "surplus": 10},
                {"date": datetime.now(), "menu": "Meals (Lunch)", "day": "Thursday", "weather": "Sunny", "footfall": 520, "predicted": 470, "prepared": 500, "consumed": 460, "surplus": 40},
                {"date": datetime.now(), "menu": "Breakfast Items", "day": "Friday", "weather": "Sunny", "footfall": 480, "predicted": 490, "prepared": 480, "consumed": 455, "surplus": 25},
            ]
            food_data_collection.insert_many(dummies)
    except Exception as e:
        print(f"\n⚠️ WARNING: Could not connect to MongoDB locally on localhost:27017.")
        print("Please ensure your MongoDB service is running for full functionality.")
        
    app.run(debug=True, port=8000)
