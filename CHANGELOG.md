Change logs
===========

## 2013-9-5
* utils.dateListAhead เพิ่มรับ parameter adj เพื่อให้สามารถกำหนดว่าจะให้ list date แบบล่วงหน้า (1 ถึง 3) หรือ ย้อนหลัง (-1 ถึง -3)
หรือถ้าไม่ระบุ default (0) คือ ล่วงหน้า/ย้อนหลัง 6/6 เดือน สำหรับ list เดือน และ 3/6 ปี สำหรับ list ปี 
* fix bug in utils.deepStrip for Array must use splice not delete

### TVS
* views/controller contract-edit เปลี่ยน field meta.tenant_type เป็น info.tenant_type
* database - BUILT_IN.contractTypes เปลี่ยนเป็น ['สัญญา','บันทึก']
* database - BUILT_IN.selfList เพิ่ม info.duration

## 2013-9-8
* numeral directive - add params 'text' render all numeral parts to text as "3 ปี" -> "สามปี"
* num2str.bahttext - incorrect covert "แสนพันบาทถ้วน" -> "แสนบาทถ้วน"
* controllers/legacy-list - define  css with state name

### TVS
* tvs/contract-edit - incorrect duration + rental_date calculation example "1 เดือน" + "01/09/2556" = "01/10/2556"
* tvs/app-route - exclude from tvs/project to new file
* views/tvs/contract-print/tof.html - typo mistake custom().code

