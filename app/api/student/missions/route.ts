import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

type Mission = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  link?: string;
};

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cityRole = session.city_role;

  const [cityRes, tradesRes, warsRes, lawsRes] = await Promise.all([
    supabaseService
      .from("cities")
      .select("leader_name, description, laws, materials, culture, story_log")
      .eq("id", session.city_id)
      .single(),
    supabaseService
      .from("trades")
      .select("id")
      .eq("from_city_id", session.city_id)
      .limit(1),
    supabaseService
      .from("wars")
      .select("id")
      .eq("attacker_city_id", session.city_id)
      .limit(1),
    supabaseService
      .from("laws")
      .select("id")
      .eq("city_id", session.city_id)
      .limit(1),
  ]);

  const city = cityRes.data as {
    leader_name: string;
    description: string;
    laws: string;
    materials: string;
    culture: string;
    story_log: string;
  } | null;

  const hasTrade = (tradesRes.data?.length ?? 0) > 0;
  const hasWar = (warsRes.data?.length ?? 0) > 0;
  const hasLaw = (lawsRes.data?.length ?? 0) > 0;

  let missions: Mission[] = [];

  if (cityRole === "lord") {
    missions = [
      {
        id: "lord_1",
        title: "ส่งคำขอค้าขายกับเมืองอื่น",
        description: "เจ้าเมืองต้องริเริ่มการค้าขายกับเมืองอื่นอย่างน้อย 1 ครั้ง เพื่อสร้างความสัมพันธ์ทางการค้า",
        done: hasTrade,
        link: "/trade",
      },
      {
        id: "lord_2",
        title: "ประกาศจุดยืนของเมือง",
        description: "กรอกคำอธิบายเมืองเพื่อแสดงตัวตนและนโยบายของผู้นำ",
        done: !!(city?.description && city.description.trim().length > 0),
        link: "/city-info",
      },
      {
        id: "lord_3",
        title: "แต่งตั้งผู้นำเมือง",
        description: "กำหนดชื่อผู้นำ/กษัตริย์ของเมืองในประวัติศาสตร์",
        done: !!(city?.leader_name && city.leader_name.trim().length > 0),
        link: "/city-info",
      },
      {
        id: "lord_4",
        title: "ตัดสินใจทางสงคราม (ถ้าจำเป็น)",
        description: "หากการเจรจาล้มเหลว เจ้าเมืองสามารถประกาศสงครามได้",
        done: hasWar,
        link: "/war",
      },
    ];
  } else if (cityRole === "city_dept") {
    missions = [
      {
        id: "dept_1",
        title: "บันทึกวัสดุและทรัพยากรพิเศษของเมือง",
        description: "กรมเมืองต้องบันทึกทรัพยากรธรรมชาติและสินค้าพิเศษที่เมืองมีในหน้าข้อมูลเมือง",
        done: !!(city?.materials && city.materials.trim().length > 0),
        link: "/city-info",
      },
      {
        id: "dept_2",
        title: "เสนอกฎหมาย 1 ฉบับ",
        description: "กรมเมืองต้องเสนอกฎหมายที่มีผลเชิงกล (เพิ่มพลังโจมตีหรือป้องกัน) อย่างน้อย 1 ฉบับ เพื่อให้ครูพิจารณา",
        done: hasLaw,
        link: "/city-info",
      },
      {
        id: "dept_3",
        title: "บันทึกกฎหมายลายลักษณ์อักษร",
        description: "กรอกกฎระเบียบและกฎหมายหลักของเมืองในส่วนกฎหมาย (ข้อความ)",
        done: !!(city?.laws && city.laws.trim().length > 0),
        link: "/city-info",
      },
    ];
  } else if (cityRole === "palace_dept") {
    missions = [
      {
        id: "palace_1",
        title: "บันทึกวัฒนธรรมและประเพณี",
        description: "กรมวังต้องบันทึกวัฒนธรรมและประเพณีสำคัญของเมืองในหน้าข้อมูลเมือง",
        done: !!(city?.culture && city.culture.trim().length > 0),
        link: "/city-info",
      },
      {
        id: "palace_2",
        title: "เขียนคำอธิบายเมืองอย่างละเอียด",
        description: "กรมวังรับผิดชอบภาพลักษณ์ของเมือง ต้องเขียนคำอธิบายที่แสดงความเป็นเอกลักษณ์",
        done: !!(city?.description && city.description.trim().length > 10),
        link: "/city-info",
      },
      {
        id: "palace_3",
        title: "แต่งตั้งผู้นำเมือง",
        description: "กรมวังดูแลพระราชพิธี ต้องกำหนดพระนามของกษัตริย์หรือผู้ปกครอง",
        done: !!(city?.leader_name && city.leader_name.trim().length > 0),
        link: "/city-info",
      },
    ];
  } else if (cityRole === "chronicler") {
    missions = [
      {
        id: "chron_1",
        title: "เขียนบันทึกประวัติศาสตร์เมือง",
        description: "คนสรุปเรื่องราวต้องเขียนบันทึกประวัติศาสตร์ของเมือง สรุปเหตุการณ์สำคัญที่เกิดขึ้น ในหน้าข้อมูลเมือง (ส่วนบันทึก)",
        done: !!(city?.story_log && city.story_log.trim().length > 0),
        link: "/city-info",
      },
      {
        id: "chron_2",
        title: "บันทึกคำอธิบายเมือง",
        description: "ช่วยทีมบันทึกประวัติศาสตร์ โดยกรอกคำอธิบายเมืองให้ครบถ้วน",
        done: !!(city?.description && city.description.trim().length > 0),
        link: "/city-info",
      },
      {
        id: "chron_3",
        title: "สังเกตการณ์และสรุปกิจกรรมค้าขาย/สงคราม",
        description: "ติดตามข่าวสารและบันทึกว่าเมืองมีกิจกรรมค้าขายหรือสงครามอย่างไร",
        done: hasTrade || hasWar,
        link: "/news",
      },
    ];
  } else {
    missions = [
      {
        id: "no_role",
        title: "เลือกบทบาทของคุณ",
        description: "กรุณาออกจากระบบและ login ใหม่พร้อมเลือกบทบาทของคุณ",
        done: false,
        link: "/",
      },
    ];
  }

  const completedCount = missions.filter((m) => m.done).length;

  return NextResponse.json({
    cityRole,
    missions,
    completedCount,
    totalCount: missions.length,
  });
}
