"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper สุ่มสีให้แต่ละแผนกไม่ซ้ำกัน
const COLORS = [
  "#2563EB", "#DC2626", "#059669", "#D97706", "#7C3AED", 
  "#DB2777", "#0891B2", "#4F46E5", "#CA8A04", "#65A30D"
];

export default function AllCyclesDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [depts, setDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/org-trend");
        const json = await res.json();
        
        if (json.data && json.data.length > 0) {
          setData(json.data);
          
          // หาชื่อแผนกทั้งหมดที่มีในระบบเพื่อมาทำเส้นกราฟ
          // โดยการดึง Keys ทั้งหมดจาก object แล้วตัด cycleId, cycleName ออก
          const allKeys = new Set<string>();
          json.data.forEach((d: any) => {
             Object.keys(d).forEach(k => {
                 if (k !== 'cycleId' && k !== 'cycleName') allKeys.add(k);
             });
          });
          setDepts(Array.from(allKeys));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังประมวลผลข้อมูลภาพรวม...</div>;
  if (data.length === 0) return <div className="p-8 text-center text-gray-500">ยังไม่มีข้อมูลรอบการประเมินที่เสร็จสิ้น</div>;

  return (
    <div className="space-y-6 mt-6">
      
      {/* Chart Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-midTitle font-semibold text-myApp-blueDark mb-2">แนวโน้มคะแนนเฉลี่ยรายแผนก (Department Trends)</h3>
        <p className="text-smallTitle text-gray-500 mb-5">เปรียบเทียบผลการประเมินของแต่ละแผนกในแต่ละรอบการประเมิน</p>
        
        <div className="h-100 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="cycleName" padding={{ left: 30, right: 30 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {depts.map((dept, index) => (
                <Line
                  key={dept}
                  type="monotone"
                  dataKey={dept}
                  name={dept}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  connectNulls // เชื่อมเส้นถ้ารอบไหนแผนกนี้ไม่มีคะแนน
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section (Optional: ดูตัวเลขละเอียด) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-150">
            <thead className="bg-myApp-blue">
                <tr>
                    <th className="px-5 py-3 text-body font-semibold text-myApp-cream w-40">รอบการประเมิน</th>
                    {depts.map(d => (
                         <th key={d} className="px-4 py-4 text-body-changed font-semibold text-myApp-cream text-center">{d}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                    <tr key={row.cycleId} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-body font-semibold text-myApp-blueDark">{row.cycleName}</td>
                        {depts.map(d => (
                             <td key={d} className="px-4 py-4 text-body font-semibold text-myApp-blueDark text-center">
                                {row[d] ? row[d].toFixed(2) : "-"}
                             </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

    </div>
  );
}