"use client";
import Input from '@/components/InputField';
import { useState } from 'react'
import { useRouter } from 'next/navigation';


const page = () => {

  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

const handleSave = async () => {
    setError("");
    setSuccess("");

    // 1. Validation รหัสผ่าน
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 6) {
        setError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
    }

    try {
      setLoading(true);

      // 2. ดึงข้อมูล User
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        setError("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
        setLoading(false);
        return;
      }
      const user = JSON.parse(rawUser);

      // --- ส่วนที่เพิ่มเพื่อ Debug ---
      console.log("User data from LocalStorage:", user); // เช็คดูว่าในนี้มี email ไหม
      
      const userEmail = user.email; // หรือถ้าเก็บชื่ออื่นเช่น user.username ให้แก้ตรงนี้

      if (!userEmail) {
        setError("ไม่พบข้อมูลอีเมลในระบบ (Session อาจไม่สมบูรณ์) กรุณา Login ใหม่");
        console.error("Email is missing inside localStorage user object");
        setLoading(false);
        return;
      }
      // --------------------------

      // 3. ยิง API
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail, // ส่งค่าตัวแปรที่เช็คแล้ว
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }

      // สำเร็จ
      setSuccess("เปลี่ยนรหัสผ่านสำเร็จ");
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        router.back(); 
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen w-screen bg-myApp-cream flex'>
        {/* Left panel */}
        <aside className={`w-[35%] bg-myApp-green flex items-center justify-center`}>
            <div className="text-white flex items-center gap-6">
                <div className="h-34 w-34 rounded-full flex items-center justify-center">
                    <img src="/image/logo.png" alt="Logo" className="h-full w-full object-contain" />
                </div>

                <div className="w-1 h-32 bg-myApp-cream rounded-full" />
                <div className="text-bigTitle font-medium leading-12">
                    ระบบ<br />จัดการ<br />ตัวชี้วัด
                </div>
            </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-md">
                <h1 className="text-center text-myApp-blueDark text-title font-medium mb-6">
                    เปลี่ยนรหัสผ่าน
                </h1>
                
                <div className="w-full flex flex-col items-center space-y-5">

                    <div className='w-[80%]'>
                        <Input
                            label="รหัสผ่านเดิม"
                            type="password"
                            showPasswordToggle
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>

                    <div className='w-[80%]'>
                        <Input
                            label="รหัสผ่านใหม่"
                            type="password"
                            showPasswordToggle
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className='w-[80%]'>
                        <Input
                            label="ยืนยันรหัสผ่านใหม่"
                            type="password"
                            showPasswordToggle
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-red-500 text-center mb-4">{error}</div>}
                    {success && <div className="text-green-600 text-center mb-4">{success}</div>}

                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-[50%] h-11 rounded-3xl bg-myApp-blue text-button text-white font-medium mt-2 shadow-sm 
                        ${loading ? "opacity-50 cursor-not-allowed" : "hover:opacity-95"}`}
                    >
                        บันทึก
                    </button>
                </div>
            </div>
        </main>
    </div>
  )
}

export default page
