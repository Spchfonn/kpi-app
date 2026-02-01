"use client";
import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation";

export type RoleKey = "evaluator" | "evaluatee";

type RoleItem = {
  key: RoleKey;
  title: string;
  color: "pink" | "yellow";
  imageSrc: string;
};

type LoginUser = {
  availableRoles: string[];
  cycle: {
    id: string;
    name?: string;
  };
};

const ITEMS: RoleItem[] = [
  { key: "evaluator", title: "ผู้ประเมิน", color: "pink", imageSrc: "/image/role-1.png" },
  { key: "evaluatee", title: "ผู้รับการประเมิน", color: "yellow", imageSrc: "/image/role-2.png" },
];

const ROLE_MAP: Record<string, RoleKey> = {
  EVALUATOR: "evaluator",
  EVALUATEE: "evaluatee",
};

const ROLE_ROUTE: Record<RoleKey, string> = {
  evaluator: "evaluator",
  evaluatee: "evaluatee",
};

const COLOR = {
	pink: {
		text: "text-myApp-blueDark",
		bg: "bg-myApp-pinkLight",
	},
	yellow: {
		text: "text-myApp-blueDark",
		bg: "bg-myApp-yellow",
	},
	} as const;

const page = () => {

	const router = useRouter();
 	const [roles, setRoles] = useState<RoleKey[]>([]);
	const [cyclePublicId, setCyclePublicId] = useState<string | null>(null);

	useEffect(() => {
		const raw = localStorage.getItem("user");
		if (!raw) {
      // ถ้าไม่มี user → กลับไปหน้า login
      router.replace("/login");
      return;
    }

		const user: LoginUser = JSON.parse(raw);

		const mappedRoles: RoleKey[] = user.availableRoles
			?.map((r) => ROLE_MAP[r])
			.filter(Boolean);

		setRoles(mappedRoles);
		setCyclePublicId(user.cycle.id);
	}, [router]);

  return (
   <div className='min-h-screen w-screen bg-myApp-cream flex'>
      {/* Left panel */}
      <aside className={`w-[35%] bg-myApp-green flex items-center justify-center`}>
         <div className="text-white flex items-center gap-6">
            {/* Logo placeholder */}
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
            <h1 className="text-center text-myApp-blueDark text-title font-medium mb-5">
               เลือกบทบาท
            </h1>

            <div className="w-full flex items-center justify-center gap-6">
                {ITEMS
						.filter((it) => roles.includes(it.key))
						.map((it) => (
							<button
								key={it.key}
								type="button"
								disabled={!cyclePublicId}
								onClick={() => {
									localStorage.setItem("selectedRole", it.key);
									router.push(`/${cyclePublicId}/${ROLE_ROUTE[it.key]}`);
								}}
                        className="w-35 h-36 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm
                              bg-myApp-white hover:bg-myApp-shadow/30"
                     >
                     <img
                        src={it.imageSrc}
                        alt={it.title}
                        className="h-20 w-20 object-contain"
                     />

                     <p className="text-button font-medium text-myApp-blueDark">
                        {it.title}
                     </p>
                  </button>
               ))}
            </div>
         </div>
      </main>
   </div>
  );
};

export default page
