Change logs
===========

## 2013-5-9
* utils.dateListAhead เพิ่มรับ parameter adj เพื่อให้สามารถกำหนดว่าจะให้ list date แบบล่วงหน้า (1 ถึง 3) หรือ ย้อนหลัง (-1 ถึง -3)
หรือถ้าไม่ระบุ default (0) คือ ล่วงหน้า/ย้อนหลัง 6/6 เดือน สำหรับ list เดือน และ 3/6 ปี สำหรับ list ปี 
* fix bug in utils.deepStrip for Array must use splice not delete

### TVS
* views/controller contract-edit เปลี่ยน field meta.tenant_type เป็น info.tenant_type
* database - BUILT_IN.contractTypes เปลี่ยนเป็น ['สัญญา','บันทึก']
* database - BUILT_IN.selfList เพิ่ม info.duration
