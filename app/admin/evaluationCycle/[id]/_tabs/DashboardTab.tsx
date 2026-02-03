// components/admin/_tabs/DashboardTab.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { clsx } from "clsx";

type DeptScoreData = {
  id: string;
  name: string;
  employeeCount: number;
  evaluatedCount: number;
  avgScore: number;
};

// 1. เพิ่ม Interface สำหรับ Props (ทำให้ cycleId เป็น Optional)
interface DashboardTabProps {
  cycleId?: string | number;
}

// 2. รับ Props เข้ามา
export default function DashboardTab({ cycleId: propCycleId }: DashboardTabProps) {
  const params = useParams();
  
  // 3. Logic เลือก ID: ถ้ามี Prop ส่งมาให้ใช้ Prop, ถ้าไม่มีให้ไปดูจาก URL
  // แปลงเป็น String ให้ชัวร์เพราะบางที ID มาเป็น number
  const id = propCycleId ? String(propCycleId) : (params?.id as string);

  const [data, setData] = useState<DeptScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
        fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // ใช้ id ที่เราคำนวณมาข้างบน
      const res = await fetch(`/api/evaluationCycles/${id}/dashboard/department-scores`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch data");
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (ส่วน Helper getBarColor และ Render กราฟ เหมือนเดิมเป๊ะ ไม่ต้องแก้) ...
  const getBarColor = (score: number) => {
    if (score >= 90) return "#10B981"; 
    if (score >= 70) return "#3B82F6"; 
    if (score >= 50) return "#F59E0B"; 
    return "#EF4444"; 
  };

  // Handle กรณีไม่มี ID เลย
  if (!id) return <div className="p-10 text-center text-gray-500">กรุณาเลือกรอบการประเมิน</div>;

  if (loading) return <div className="p-10 text-center text-gray-500">กำลังประมวลผลข้อมูล...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (data.length === 0) return <div className="p-10 text-center text-gray-500">ยังไม่มีข้อมูลการประเมินที่เสร็จสมบูรณ์ในรอบนี้</div>;

  const totalAvg = data.reduce((acc, curr) => acc + curr.avgScore, 0) / data.length;
  const maxScoreDept = data.reduce((prev, current) => (prev.avgScore > current.avgScore ? prev : current));
  const minScoreDept = data.reduce((prev, current) => (prev.avgScore < current.avgScore ? prev : current));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       {/* ... Copy Code Render เดิมมาวางตรงนี้ได้เลย ... */}
       {/* 1. Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard 
            title="คะแนนเฉลี่ยทั้งองค์กร" 
            value={totalAvg.toFixed(2)} 
            subText="เต็ม 100 คะแนน"
            color="blue"
        />
        <SummaryCard 
            title="แผนกคะแนนสูงสุด" 
            value={maxScoreDept.avgScore.toFixed(2)} 
            subText={maxScoreDept.name}
            color="green"
        />
        <SummaryCard 
            title="แผนกคะแนนต่ำสุด" 
            value={minScoreDept.avgScore.toFixed(2)} 
            subText={minScoreDept.name}
            color="orange"
        />
      </div>

      {/* 2. Main Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="mb-6 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Department Performance Comparison</h3>
                <p className="text-sm text-gray-500">เปรียบเทียบคะแนนเฉลี่ยรายแผนก</p>
            </div>
            <button onClick={fetchData} className="text-sm text-myApp-blueDark hover:underline">
                Refresh Data
            </button>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={60} tick={{fontSize: 12}} />
              <YAxis domain={[0, 100]} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <ReferenceLine y={totalAvg} label="Avg" stroke="red" strokeDasharray="3 3" />
              <Bar dataKey="avgScore" name="คะแนนเฉลี่ย" radius={[4, 4, 0, 0]} barSize={50}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.avgScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">ชื่อแผนก</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">จำนวนพนักงาน</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">ประเมินเสร็จแล้ว</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">คะแนนเฉลี่ย</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.employeeCount}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">
                            <span className={clsx(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                row.evaluatedCount === row.employeeCount ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            )}>
                                {row.evaluatedCount} / {row.employeeCount}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                            <span style={{ color: getBarColor(row.avgScore) }}>
                                {row.avgScore.toFixed(2)}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

// ... SummaryCard component เหมือนเดิม ...
function SummaryCard({ title, value, subText, color }: { title: string, value: string, subText: string, color: 'blue' | 'green' | 'orange' }) {
    const colorClass = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        green: "text-green-600 bg-green-50 border-green-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100",
    }[color];

    return (
        <div className={`p-6 rounded-lg border ${colorClass} flex flex-col items-center justify-center text-center shadow-sm`}>
            <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-xs opacity-75">{subText}</p>
        </div>
    );
}