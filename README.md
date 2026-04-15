# IntelliServe AI 

IntelliServe AI is a Predictive Food Demand & Smart Redistribution System. It is an end-to-end full-stack platform designed to predict food demand dynamically, detect surplus food, and optimize the redistribution matrix to NGOs using an AI-powered prediction engine.

## 🚀 Features
- **Admin Dashboard**: A comprehensive hub to view real-time operations, overall analytics, and daily stats.
- **Demand Prediction Engine**: Predicts how much food will be needed dynamically based on AI models.
- **Surplus Detection**: Flags food items nearing expiration or exceeding expected demand thresholds.
- **Smart NGO Redistribution**: Recommends the "Best Match" NGOs based on geolocation and real-time food surplus data.
- **Analytics & Reporting**: Tracks sales or redistribution data, including data filters and dynamic visualizations.

## 🛠 Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS
- **Backend/AI Service**: Python (Flask/FastAPI based on the provided setup), Scikit-Learn
- **Package Managers**: npm, pip

## 📂 Project Structure
- **/intelliserve-ui**: Frontend folder containing the React application.
- **/backend**: Backend and ML layer containing `app.py` and model training scripts (`train_model.py`).

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Python 3.9+

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd intelliserve-ui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up a Python virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   python app.py
   ```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is for demonstration and personal use.
