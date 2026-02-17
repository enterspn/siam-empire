# วิธีขึ้น Vercel (vercel.com)

## วิธีที่ 1: ผ่านเว็บ (แนะนำ)

### ขั้นตอน

1. **อัปโหลดโค้ดขึ้น GitHub**
   - เปิด [github.com](https://github.com) สร้าง repo ใหม่ (เช่น `siam-empire`)
   - ในโฟลเดอร์โปรเจกต์รัน:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ชื่อคุณ/siam-empire.git
   git push -u origin main
   ```

2. **สมัคร/ล็อกอิน Vercel**
   - ไปที่ [vercel.com](https://vercel.com) → Sign in ด้วย GitHub

3. **สร้างโปรเจกต์ใหม่**
   - คลิก **Add New** → **Project**
   - เลือก repo ที่ push ไว้ (เช่น `siam-empire`)
   - **Framework Preset:** Next.js (เดาให้อัตโนมัติ)
   - **Root Directory:** ว่างไว้
   - คลิก **Deploy** (ยังไม่ต้องใส่ Environment Variables ก่อน)

4. **ใส่ตัวแปรสภาพแวดล้อม (สำคัญมาก)**
   - หลัง deploy ครั้งแรกอาจ error เพราะยังไม่มี env
   - ไปที่โปรเจกต์ → **Settings** → **Environment Variables**
   - เพิ่มทีละตัว (ค่าเดียวกับใน `.env.local` ของคุณ):

   | Name | Value | หมายเหตุ |
   |------|--------|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ค่า URL จาก Supabase | โปรเจกต์ Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ค่า anon public key | เดียวกัน |
   | `SUPABASE_SERVICE_ROLE_KEY` | ค่า service_role key | **เก็บเป็นความลับ** |
   | `ADMIN_PASSWORD` | รหัสครู (เช่น teacher2024) | ใช้ล็อกอินแผงครู |

   - เลือก **Production**, **Preview**, **Development** ตามต้องการ (อย่างน้อยเลือก Production)
   - กด **Save**

5. **Deploy ใหม่**
   - ไปที่แท็บ **Deployments** → คลิก **...** ที่ deployment ล่าสุด → **Redeploy**
   - หรือ push commit ใหม่จากเครื่อง จะ deploy อัตโนมัติ

6. **เช็กผล**
   - เปิด URL ที่ Vercel ให้ (เช่น `siam-empire-xxx.vercel.app`)
   - ทดสอบ: หน้าหลัก → ล็อกอินนักเรียน/ครู → ใช้งานตามปกติ

---

## วิธีที่ 2: ใช้ Vercel CLI (ไม่ต้องใช้ GitHub ก่อน)

1. **ติดตั้ง CLI**
   ```bash
   npm i -g vercel
   ```

2. **ล็อกอิน**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd "d:\โรงเรียนนาหนังพัฒนศึกษา\ประวัติศาสตร์\เกมประวัติศาสตร์"
   vercel
   ```
   - ถามคำถามให้ตอบตาม (ลิงก์กับโปรเจกต์เดิมหรือสร้างใหม่)
   - **สำคัญ:** หลัง deploy ครั้งแรก ไปที่ Dashboard → Project → **Settings** → **Environment Variables** แล้วเพิ่ม 4 ตัวด้านบน จากนั้น **Redeploy**

---

## สิ่งที่ต้องมีใน Supabase

- ตารางและ RLS ตามที่ใช้ในโปรเจกต์ (รัน migration / schema ใน Supabase แล้ว)
- ใน Supabase → **Authentication** → **URL Configuration**: ใส่ **Site URL** เป็นโดเมน Vercel ของคุณ (เช่น `https://siam-empire-xxx.vercel.app`) ถ้าใช้ auth; โปรเจกต์นี้ใช้แค่ cookie + group code อาจไม่บังคับ

---

## ถ้า Build ล้มเหลว

- ดู log ใน Vercel → Deployments → คลิก deployment ที่ fail
- มักเป็นเพราะไม่มี env: ใส่ครบ 4 ตัวแล้ว Redeploy
- ถ้า error เรื่อง path/encoding: โฟลเดอร์ชื่อภาษาไทยมักไม่มีปัญหา แต่ถ้ามี ให้ลองย้ายโปรเจกต์ไป path ภาษาอังกฤษแล้ว push ใหม่
