import { useState, useEffect } from 'react';
import { AlertTriangle, Info, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cx(...args) {
  return twMerge(clsx(args));
}

export default function Surplus() {
  const [surplusData, setSurplusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('All');
  const [selectedItemId, setSelectedItemId] = useState(null);

  useEffect(() => {
    const fetchSurplusData = async () => {
      setIsLoading(true);
      try {
        const url = selectedDay === 'All' 
          ? 'http://localhost:8000/api/surplus-data' 
          : `http://localhost:8000/api/surplus-data?day=${selectedDay}`;
        const response = await fetch(url);
        const data = await response.json();
        setSurplusData(data);
      } catch (error) {
        console.error("Error fetching surplus data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurplusData();
  }, [selectedDay]);

  const markDelivered = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/mark-delivered/${id}`, { method: 'POST' });
      // Re-fetch data
      const url = selectedDay === 'All' ? 'http://localhost:8000/api/surplus-data' : `http://localhost:8000/api/surplus-data?day=${selectedDay}`;
      const response = await fetch(url);
      const data = await response.json();
      setSurplusData(data);
    } catch(e) {
      console.error(e);
    }
  };

  const totalSurplus = surplusData.reduce((acc, curr) => acc + curr.surplus, 0);
  const totalPrepared = surplusData.reduce((acc, curr) => acc + curr.prepared, 0);
  const surplusPercentage = totalPrepared > 0 ? (totalSurplus / totalPrepared) * 100 : 0;
  
  let riskObj = {
    level: "Low", short: "LOW", color: "green",
    desc: "Waste is within acceptable limits. No immediate action needed."
  };

  const selectedItem = surplusData.find(d => d.id === selectedItemId);
  let cardTitle = "Current Status (Overall)";
  let cardSubtitle = `Total ${totalSurplus} items currently recorded as surplus. Action recommended to redistribute.`;
  let cardExtra = null;

  if (selectedItem) {
    const hoursElapsed = selectedItem.date ? (new Date() - new Date(selectedItem.date)) / (1000 * 60 * 60) : 0;
    const isExpired = selectedItem.surplus > 0 && hoursElapsed >= 3.5;
    const wasteRate = selectedItem.prepared > 0 ? ((selectedItem.surplus / selectedItem.prepared) * 100).toFixed(1) : 0;
    
    cardTitle = `Status: ${selectedItem.menu}`;
    cardSubtitle = `Waste Rate is ${wasteRate}% out of ${selectedItem.prepared} prepared.`;
    
    if (isExpired) {
      riskObj = { level: "Expired", short: "EXP", color: "red", desc: "This batch has exceeded the safe 3.5 hour window and is marked as expired." };
      cardExtra = "Status: Expired";
    } else if (selectedItem.delivered > 0 && selectedItem.surplus === 0) {
      riskObj = { level: "Delivered", short: "OK", color: "green", desc: "Successfully delivered. No further action needed." };
      cardExtra = "Status: Delivered";
    } else if (selectedItem.surplus === 0) {
      riskObj = { level: "Clear", short: "CLR", color: "green", desc: "No surplus remaining." };
      cardExtra = "Status: Clear";
    } else if (selectedItem.isHigh) {
       riskObj = { level: "High", short: "HIGH", color: "red", desc: "Significant surplus detected for this item. Immediate redistribution required." };
       cardExtra = "Status: Action Req.";
    } else {
       riskObj = { level: "Moderate", short: "MOD", color: "amber", desc: "Action recommended to redistribute close-to-expiry items." };
       cardExtra = "Status: Monitor";
    }
  } else {
    if (surplusPercentage > 25 || totalSurplus > 100) {
      riskObj = { level: "High", short: "HIGH", color: "red", desc: "Significant surplus detected. Immediate redistribution required." };
    } else if (surplusPercentage > 10 || totalSurplus > 30) {
      riskObj = { level: "Moderate", short: "MOD", color: "amber", desc: "Action recommended to redistribute close-to-expiry items." };
    }
  }

  const themeColors = {
    green: { icon: "text-green-500", border: "border-green-400", text: "text-green-600", bgBox: "bg-green-50", boxBorder: "border-green-200", boxIcon: "text-green-400", boxTitle: "text-green-800", boxDesc: "text-green-700" },
    amber: { icon: "text-amber-500", border: "border-amber-400", text: "text-amber-600", bgBox: "bg-amber-50", boxBorder: "border-amber-200", boxIcon: "text-amber-400", boxTitle: "text-amber-800", boxDesc: "text-amber-700" },
    red: { icon: "text-red-500", border: "border-red-400", text: "text-red-600", bgBox: "bg-red-50", boxBorder: "border-red-200", boxIcon: "text-red-400", boxTitle: "text-red-800", boxDesc: "text-red-700" }
  };
  const theme = themeColors[riskObj.color];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Surplus Detection
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor real-time food consumption vs preparation to detect surplus.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
          >
            <option value="All">All Time</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Level Card */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center">
              <AlertTriangle className={`mr-2 h-5 w-5 ${theme.icon}`} />
              {cardTitle}
            </h3>
            
            <div className="flex-1 flex flex-col justify-center items-center py-6">
              <div className={`w-32 h-32 rounded-full border-8 ${theme.border} flex items-center justify-center mb-4`}>
                <span className={`text-3xl font-bold ${theme.text}`}>{riskObj.short}</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">Waste Risk Level: {riskObj.level}</h4>
              <p className="text-sm text-gray-500 text-center">
                {cardSubtitle}
              </p>
              {cardExtra && (
                <div className="mt-4 font-bold text-gray-800 bg-gray-100 border border-gray-200 shadow-sm px-4 py-1.5 rounded-full">{cardExtra}</div>
              )}
            </div>

            <div className={`mt-auto ${theme.bgBox} rounded-md p-4 border ${theme.boxBorder}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className={`h-5 w-5 ${theme.boxIcon}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${theme.boxTitle}`}>Recommendation</h3>
                  <div className={`mt-2 text-sm ${theme.boxDesc}`}>
                    <p>{riskObj.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Preparation Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Menu Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prepared
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consumed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surplus
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivered
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waste Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                       <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading data...</td>
                    </tr>
                  ) : surplusData.length === 0 ? (
                    <tr>
                       <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No surplus data available today.</td>
                    </tr>
                  ) : (
                    surplusData.map((item) => {
                      const hoursElapsed = item.date ? (new Date() - new Date(item.date)) / (1000 * 60 * 60) : 0;
                      const isExpired = item.surplus > 0 && hoursElapsed >= 3.5;
                      const wasteRate = item.prepared > 0 ? ((item.surplus / item.prepared) * 100).toFixed(1) : 0;

                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                          className={cx(
                            selectedItemId === item.id 
                              ? 'bg-primary-50 ring-2 ring-inset ring-primary-500 border-primary-500' 
                              : (item.isHigh ? 'bg-red-50' : 'hover:bg-gray-50'), 
                            'transition-colors cursor-pointer'
                          )}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.menu}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.prepared}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.consumed}
                          </td>
                          <td className={cx("px-6 py-4 whitespace-nowrap text-sm font-bold", item.surplus > 0 ? 'text-red-600' : 'text-gray-500')}>
                            {item.surplus}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                            {item.delivered || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium whitespace-nowrap">
                            {wasteRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isExpired ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                                Expired
                              </span>
                            ) : item.delivered > 0 && item.surplus === 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Delivered
                              </span>
                            ) : item.surplus === 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Clear
                              </span>
                            ) : item.isHigh ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Action Req.
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Monitor
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {item.surplus > 0 && !isExpired && (
                               <button onClick={() => markDelivered(item.id)} className="text-primary-600 hover:text-primary-800 font-medium text-xs bg-primary-50 px-3 py-1.5 rounded border border-primary-200 shadow-sm transition-colors hover:bg-primary-100">
                                 Deliver
                               </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
