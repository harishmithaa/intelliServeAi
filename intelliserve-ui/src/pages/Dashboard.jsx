import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Utensils, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cx(...args) {
  return twMerge(clsx(args));
}

export default function Dashboard() {
  const [lineChartData, setLineChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [stats, setStats] = useState([
    { name: 'Predicted Demand', value: '0', unit: 'meals', icon: TrendingUp, change: '0%', changeType: 'positive' },
    { name: 'Food Prepared Today', value: '0', unit: 'meals', icon: Utensils, change: '0%', changeType: 'positive' },
    { name: 'Actual Consumption', value: '0', unit: 'meals', icon: TrendingDown, change: '0%', changeType: 'negative' },
    { name: 'Surplus Food Available', value: '0', unit: 'meals', icon: Trash2, change: '0%', changeType: 'negative' },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard-stats');
        const data = await response.json();
        setLineChartData(data.lineChartData || []);
        setBarChartData(data.barChartData || []);
        if (data.latestStats) {
          setStats([
            { name: 'Predicted Demand', value: data.latestStats.predicted, unit: 'meals', icon: TrendingUp, change: '+4.75%', changeType: 'positive' },
            { name: 'Food Prepared Today', value: data.latestStats.prepared, unit: 'meals', icon: Utensils, change: '+5.4%', changeType: 'positive' },
            { name: 'Actual Consumption', value: data.latestStats.consumed, unit: 'meals', icon: TrendingDown, change: '-3.2%', changeType: 'negative' },
            { name: 'Surplus Food Available', value: data.latestStats.surplus, unit: 'meals', icon: Trash2, change: '+12%', changeType: 'negative' },
          ]);
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Admin Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of today's insights and predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p className="ml-2 text-sm text-gray-500">{item.unit}</p>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <span className={cx(item.changeType === 'positive' ? 'text-green-600' : 'text-red-600', 'font-medium')}>
                    {item.change}
                  </span>
                  <span className="text-gray-500 ml-2">from yesterday</span>
                </div>
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Predicted vs Actual Consumption (Past 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Food Waste Per Menu Type (Meals)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="waste" name="Surplus/Waste" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
