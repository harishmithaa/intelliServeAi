import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const weeklyTrendData = [
  { name: 'Week 1', demand: 3200, waste: 400 },
  { name: 'Week 2', demand: 3350, waste: 350 },
  { name: 'Week 3', demand: 3100, waste: 450 },
  { name: 'Week 4', demand: 3400, waste: 250 },
  { name: 'Week 5', demand: 3600, waste: 200 },
];

const popularItemsData = [
  { name: 'Chicken Biryani', value: 850 },
  { name: 'Veg Meals', value: 720 },
  { name: 'Dosa', value: 540 },
  { name: 'Sandwich', value: 300 },
];
const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

const highestWasteDays = [
  { day: 'Friday', waste: '18% higher', reason: 'Weekend departure' },
  { day: 'Monday', waste: '12% higher', reason: 'Unpredictable return count' },
  { day: 'Thursday', waste: '5% higher', reason: 'Menu fatigue' },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          System Analytics
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Deep dive into historical data, consumption trends, and AI model performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Area Chart */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Weekly Demand vs Waste Trends (Past 5 Weeks)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="demand" name="Total Demand" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDemand)" />
                <Area type="monotone" dataKey="waste" name="Total Waste/Surplus" stroke="#ef4444" fillOpacity={1} fill="url(#colorWaste)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Items Pie Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Most Popular Menu Items (Monthly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={popularItemsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {popularItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highest Waste Days Insights */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Highest Waste Days</h3>
          <div className="space-y-4">
            {highestWasteDays.map((item, index) => (
              <div key={item.day} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{item.day}</h4>
                    <p className="text-xs text-gray-500">{item.reason}</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-red-600">
                  {item.waste}
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
              <span className="font-bold block mb-1">AI Insight:</span>
              Consider reducing default preparation buffers by 10% on Fridays to significantly cut down weekly waste metrics.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
