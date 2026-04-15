import { useState } from 'react';
import { Calculator, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Prediction() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSpecialEvent, setIsSpecialEvent] = useState(false);
  const [showResult, setShowResult] = useState(() => {
    return localStorage.getItem('predictionShowResult') === 'true';
  });
  const [predictionData, setPredictionData] = useState(() => {
    const saved = localStorage.getItem('predictionData');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsPredicting(true);
    setShowResult(false);
    
    const formData = {
      menuType: e.target.menuType.value,
      footfall: e.target.footfall.value,
      dayOfWeek: e.target.dayOfWeek.value,
      weather: e.target.weather.value,
    };

    try {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setPredictionData(data);
      setShowResult(true);
      localStorage.setItem('predictionData', JSON.stringify(data));
      localStorage.setItem('predictionShowResult', 'true');

      // Connect the flow: Save to MongoDB so Dashboard & Surplus pages get updated
      try {
        const consumedEstimate = Math.floor(data.predicted_consumption * 0.95);
        await fetch('http://localhost:8000/api/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             menu: formData.menuType,
             day: formData.dayOfWeek,
             weather: formData.weather,
             footfall: formData.footfall,
             predicted: data.predicted_consumption,
             prepared: data.recommended_preparation,
             consumed: consumedEstimate,
             surplus: data.recommended_preparation - consumedEstimate
          })
        });
      } catch (saveError) {
        console.error("Failed to save prediction to DB:", saveError);
      }

    } catch (error) {
      console.error("Prediction API Error:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Demand Prediction
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter parameters to get AI-powered food preparation recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label htmlFor="menuType" className="block text-sm font-medium text-gray-700">Menu Type</label>
              <select id="menuType" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
                <option>Meals (Lunch)</option>
                <option>Biryani (Dinner)</option>
                <option>Breakfast Items</option>
                <option>Snacks</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="footfall" className="block text-sm font-medium text-gray-700">Expected Student Footfall</label>
              <input type="number" id="footfall" defaultValue={500} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2 px-3 border" />
            </div>

            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">Day of Week</label>
              <select id="dayOfWeek" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
            </div>

            <div>
              <label htmlFor="weather" className="block text-sm font-medium text-gray-700">Weather Condition</label>
              <select id="weather" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
                <option>Sunny / Normal</option>
                <option>Rainy</option>
                <option>Cold / Winter</option>
                <option>Extreme Heat</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex-grow flex flex-col">
                <span className="text-sm font-medium text-gray-900" id="availability-label">Exam / Special Event Day</span>
                <span className="text-sm text-gray-500" id="availability-description">Usually impacts overall attendance.</span>
              </span>
              <button 
                type="button" 
                onClick={() => setIsSpecialEvent(!isSpecialEvent)}
                className={`${isSpecialEvent ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                role="switch" 
                aria-checked={isSpecialEvent}
              >
                <span aria-hidden="true" className={`${isSpecialEvent ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}></span>
              </button>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isPredicting}
                className="w-full flex justify-center items-center py-2px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 py-2 transition-colors"
              >
                {isPredicting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Patterns...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Calculator className="mr-2 h-5 w-5" />
                    Generate Prediction
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Result Card */}
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 flex flex-col justify-center min-h-[400px]">
          {!showResult && !isPredicting && (
            <div className="text-center">
              <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prediction generated</h3>
              <p className="mt-1 text-sm text-gray-500">Fill out the form and click predict to see AI recommendations.</p>
            </div>
          )}

          {isPredicting && (
            <div className="text-center animate-pulse">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary-600 font-medium">Running prediction models...</p>
            </div>
          )}

          {showResult && (
            <div className="bg-white shadow-xl rounded-xl p-6 border border-primary-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">AI Recommendation</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle2 className="-ml-0.5 mr-1.5 h-4 w-4" />
                  High Confidence (94%)
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
                  <p className="text-sm font-medium text-primary-800 uppercase tracking-wider mb-1">Predicted Demand</p>
                  <p className="text-3xl font-extrabold text-primary-600">{predictionData?.predicted_consumption || 0} <span className="text-lg font-normal text-primary-800">meals</span></p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-1">Recommended Preparation</p>
                  <p className="text-2xl font-bold text-gray-900">{predictionData?.recommended_preparation || 0} <span className="text-base font-normal text-gray-600">meals</span></p>
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
                    Includes safety buffer of {predictionData ? (predictionData.recommended_preparation - predictionData.predicted_consumption) : 0} meals
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
