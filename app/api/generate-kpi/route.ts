import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/**
 * ฟังก์ชันเรียกใช้ OpenAI Chat API
 * @param messages array ของข้อความสำหรับ model
 */
async function callChatGPT(messages: any[]) {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${text}`);
  }

  return res.json();
}

/**
 * API Route POST สำหรับสร้าง KPI + Measurement
 */
export async function POST(req: Request) {
  try {
    // ตรวจสอบว่ามี Body ส่งมาจริงไหม
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       return NextResponse.json({ success: false, error: "Invalid Content-Type" }, { status: 400 });
    }

    const body = await req.json();
    if (!body || Object.keys(body).length === 0) {
       throw new Error("Request body is empty");
    }
    
    const { evaluateeId, kpiCount } = body;
    
    if (!evaluateeId) {
      return NextResponse.json(
        { success: false, error: "Missing evaluateeId" },
        { status: 400 }
      );
    }

    // 2. ดึงข้อมูล Employee จาก Database พร้อม Relation ที่เกี่ยวข้อง
    const employee = await prisma.employee.findUnique({
      where: { id: evaluateeId },
      include: {
        position: true,
        level: true,
        organization: true,
      },
    });
    console.log("ผลการหา Employee:", employee);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    // 3. เตรียมข้อมูลสำหรับ Prompt
    const positionName = employee.position?.name || "ไม่ระบุตำแหน่ง";
    const levelName = employee.level?.name || "ไม่ระบุระดับ";
    const orgName = employee.organization?.name || "ไม่ระบุแผนก";
    const jobDescription = employee.jobDescription || "- ไม่ได้ระบุรายละเอียดงาน -";
    const kpiQuantityText = kpiCount ? `${kpiCount} ข้อ` : "6–8 ข้อ";

    /* ---------------- รอบที่ 1: สร้าง KPI ---------------- */
    const round1Messages = [
      {
        role: "system",
        content:
          "คุณเป็นผู้เชี่ยวชาญด้านการออกแบบ KPI องค์กร หน้าที่ของคุณคือออกแบบ KPI ให้เหมาะกับตำแหน่งงานและวัดผลได้จริง ตอบเป็น JSON เท่านั้นตาม schema ที่กำหนด ห้ามมีข้อความอื่นนอก JSON ห้ามใช้ markdown/code fence",
      },
      {
        role: "user",
        content: `บริบทผู้ใช้งาน (ใช้เพื่อออกแบบ KPI):
- ตำแหน่งงาน: ${positionName}
- ระดับ: ${levelName}
- แผนก: ${orgName}
- รายละเอียดงานหลัก (Job Description):
  ${jobDescription}
งานที่ต้องทำ:
1) แนะนำ KPI ในรูปแบบ 2 ระดับ
   - ระดับที่ 1 = หมวดเป้าหมาย (3 หมวด)
   - ระดับที่ 2 = KPI รายข้อภายใต้หมวดนั้น
2) จำนวน KPI ระดับที่ 2 รวมทั้งหมด ${kpiQuantityText} ข้อ *ห้ามขาดและห้ามเกิน
3) KPI ทุกข้อต้อง:
   - วัดได้จริงจากแหล่งข้อมูลที่ระบุด้านบน
   - เป็น KPI ระดับบุคคล (Individual KPI) ไม่ใช่ KPI ทั้งทีมล้วนๆ
   - ไม่ซ้ำกัน และครอบคลุมทั้ง output/outcome/quality/efficiency อย่างสมดุล
4) ถ้าต้องสมมติ (assumption) ให้ใส่สั้น ๆ ใน field assumptions
5) group_percent คือเปอร์เซ็นค่าน้ำหนักของ kpi กลุ่มนั้นซึ่งทุกลุ่มจะต้องเอามารวมกันได้ครบ 100 เปอร์เซ็น
6) kpi_percent คือเปอร์เซ็นค่าน้ำหนักของ kpi แต่ละตัวในกลุ่ม ซึ่งทุกตัวในกลุ่มต้องรวมกันได้ 100 เปอร์เซ็น

ข้อกำหนดการตอบ:
- ตอบเป็น JSON เท่านั้น
- ต้องตรง schema ด้านล่างแบบเคร่งครัด (ห้ามมี key เกิน/ขาด)
- ห้ามมีข้อความอื่นนอก JSON
- ถ้าทำตามไม่ได้ ให้ตอบ {} เท่านั้น
- title ให้ตอบเป็นภาษาไทยเท่านั้น
- ใน 1 รอบต้องแนะนำ KPI คละอย่างน้อย 2 แบบ (Quantitative, Quenlitative, Custom)

schema (ต้องใช้ key ตามนี้เท่านั้น):
{
  'assumptions': ['string'],
  'level1_groups': [
    {
      'group_code': 'string',
      'group_title': 'string',
      'group_goal': 'string',
      'group_percent': 'number',
      'level2_kpis': [
        {
          'kpi_code': 'string',
          'title': 'string',
          'description': 'string',
          'kpi_type': 'quantitative | qualitative | custom',
          'timeframe': 'weekly | monthly | quarterly',
          'kpi_percent': 'number',
        }
      ]
    }
  ]
}
หมายเหตุ:
- group_code แนะนำให้เป็น G-001, G-002, ...
- kpi_code แนะนำให้เป็น KPI-001, KPI-002, ... และต้องไม่ซ้ำกัน
เริ่มตอบได้เลย`,
      },
    ];

const round1Response = await callChatGPT(round1Messages);
    const round1Content = round1Response.choices[0].message.content;

    console.log("===== ROUND 1 RAW CONTENT =====");
    console.log(round1Content);

  let round1Data;
  try {
      // ใช้ Regex ลบทุกอย่างที่อยู่นอกปีกกา { ... } ถ้า AI เผลอใส่ข้อความอื่นมา
      const jsonMatch = round1Content.match(/\{[\s\S]*\}/);
      const cleaned = jsonMatch ? jsonMatch[0] : round1Content;
      round1Data = JSON.parse(cleaned);
  } catch (e) {
      console.error("Failed to parse JSON:", round1Content);
      throw new Error("AI returned invalid JSON format");
  }

    console.log("===== ROUND 1 PARSED =====");
    console.log(round1Data);

    /* -------- flatten KPI -------- */
    const allKpis = round1Data.level1_groups.flatMap(
      (group: any) => group.level2_kpis
    );


    /* ---------------- รอบที่ 2: สร้าง Measurement + Scoring ---------------- */
    const round2Messages = [
      {
        role: "system",
        content:
          "คุณเป็นผู้เชี่ยวชาญด้านการออกแบบ KPI องค์กร หน้าที่ของคุณคือออกแบบ KPI ให้เหมาะกับตำแหน่งงานและวัดผลได้จริง ตอบเป็น JSON เท่านั้นตาม schema ที่กำหนด ห้ามมีข้อความอื่นนอก JSON ห้ามใช้ markdown/code fence",
      },
      {
        role: "user",
        content: `บริบทเพิ่มเติม (ใช้เพื่อกำหนดเกณฑ์วัดผล)
- ตำแหน่งงาน: ${positionName}
- ระดับ: ${levelName}

รายการ KPI (ได้จากรอบก่อน): ${JSON.stringify(allKpis, null, 2)}

งานที่ต้องทำ
1) เติม field "measurement" ให้ KPI ทุกข้อ
2) ใช้ kpi_code ที่มีอยู่แล้วเท่านั้น
3) ห้ามแก้ไข:
   - title
   - description
   - kpi_type
   - timeframe
   - data_sources (ห้ามเพิ่มใหม่ ใช้ได้แค่ subset เดิม)
4) KPI 1 รายการ ต้องเลือกวิธีวัดผลได้ “เพียงแบบเดียว” ตาม kpi_type เท่านั้น
5) ใน 1 รอบต้องแนะนำ KPI คละอย่างน้อย 2 แบบ (Quantitative, Quenlitative, Custom)

ข้อกำหนดตามประเภท KPI
[1] quantitative
- unit ต้องสอดคล้องกับ metric (เช่น percent, count, minutes, points)
- target.value ต้องเป็น “ตัวเลข”
- scoring ต้องมี 5 ระดับ (score = 1–5)
- condition ต้องเป็นแค่ “ตัวเลข”
- condition ห้ามซ้ำกันเกินไป

  ตัวอย่าง:
  "scoring": [
          {
            "condition": 95, //หมายถึงถ้าได้คะแนนตั้งแต่ 95 ขึ้นไป
            "score": 5
          },
          {
            "condition": 90, //หมายถึงถ้าได้คะแนนตั้งแต่ 90 ถึง 94.9
            "score": 4
          },
          {
            "condition": 80, //หมายถึงถ้าได้คะแนนตั้งแต่ 80 ถึง 89.9
            "score": 3
          },
          {
            "condition": 70, //หมายถึงถ้าได้คะแนนตั้งแต่ 70 ถึง 79.9
            "score": 2
          },
          {
            "condition": 0, //หมายถึงถ้าได้คะแนนน้อยกว่า 70 ลงไป
            "score": 1
          }

[2] qualitative
- unit ต้องเป็น "percent"
- ใช้วิธีคิดคะแนนจาก checklist
- checklist ต้องมี item + weight_percent และรวมกัน = 100%
- scoring ต้องมี 5 ระดับ (1–5)
- ใน notes ต้องแนบ checklist พร้อม % ของแต่ละกิจกรรมอย่างชัดเจน

[3] custom
- unit ให้ใช้ "level" หรือหน่วยที่เหมาะสม
- scoring ต้องเป็นคำอธิบายเชิงคุณภาพ 5 ระดับ (1–5)
- condition ต้องเป็นข้อความล้วน เช่น:
  - "ระดับ 5: ทำได้ครบทุกข้อ + มีการปรับปรุงเชิงรุก"
  - ...
  - "ระดับ 1: ไม่สามารถดำเนินการได้ตามที่คาดหวัง"

  ข้อกำหนดความขัดแย้งของ field (ห้ามผิดเด็ดขาด)

- measurement 1 รายการ ต้องเลือกวิธีให้คะแนนได้ “เพียงแบบเดียว” เท่านั้น
- ห้ามมี checklist และ scoring พร้อมกันเด็ดขาด

กติกา:
1) ถ้าใช้ checklist
   - ให้ใช้ field "checklist" เท่านั้น
   - field "scoring" ต้องเป็น [] (array ว่าง)
2) ถ้าใช้ scoring
   - ให้ใช้ field "scoring" เท่านั้น
   - field "checklist" ต้องเป็น [] (array ว่าง)
หากละเมิดข้อใดข้อหนึ่ง ให้ตอบ "{}" ทันที

ข้อกำหนด scoring (สำคัญมาก)
- KPI ทุกข้อ “ต้องมี scoring ครบ 5 ระดับเสมอ”
- score ใช้ได้เฉพาะตัวเลข 1, 2, 3, 4, 5 เท่านั้น
- ห้ามเว้น scoring ว่าง
- ห้ามใช้ระบบคะแนนแบบอื่น
- title, metric_name และ definition ต้องเป็นภาษาไทยเท่านั้น

ข้อกำหนดเพิ่มเติม
- frequency ต้องสอดคล้องกับ timeframe ของ KPI (weekly / monthly / quarterly)
- หากไม่สามารถกำหนดเกณฑ์วัดผลให้ KPI ใดได้
  → ใส่เหตุผลสั้น ๆ ใน field "notes"
- หากไม่สามารถทำตามข้อกำหนดทั้งหมดได้
  → ให้ตอบ "{}" เท่านั้น

รูปแบบคำตอบ (ต้องตรง schema เท่านั้น)
ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON

{
  "kpi_measurements": [
    {
      "kpi_code": "string",
      "measurement": {
        "metric_name": "string",
        "definition": "string",
        "unit": "string",
        "frequency": "weekly | monthly | quarterly"
      },
      "checklist": [],
      "scoring": [],
      "notes": "string"
    }
  ]
}
เริ่มตอบได้ทันที
`,
      },
    ];

    const round2Response = await callChatGPT(round2Messages);
    const round2Content = round2Response.choices[0].message.content;

    function parseAIResponse(content: string) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const cleaned = jsonMatch ? jsonMatch[0] : content;
        return JSON.parse(cleaned);
      } catch (e) {
        throw new Error("AI returned invalid JSON format");
      }
    }
   const round2Data = parseAIResponse(round2Content); 

    /* ---------------- return JSON ---------------- */
    return NextResponse.json({
      success: true,
      round1_raw: round1Data,
      allKpis,
      measurements: round2Data,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}