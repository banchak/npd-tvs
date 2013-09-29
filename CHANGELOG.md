Change logs
===========
## 2013-9-29
* legacy-edit เพิ่ม operation ditto, postState
* legacy-list รองรับ state posted, cancelled, pending
* moment - filter กรณีข้อมูลไม่มีค่า แสดงเป็นว่างๆ (เดิมแสดงวันที่วันนี้)
* mongolab - เพิ่ม function bulkUpdate, bulkInsert

### NPD
* voucher-edit คำสั่ง ผ่านรายการ, คืนรายการ
* product-edit คำสั่ง ซื้อคืน
* image-sync แก้ bug
* product data - เพิ่ม field : meta.tooks (ประวัติยืม), info.taking.site (ยืมที่), info.taking.voucher (เอกสาร), meta.kepts (ประวัติเก็บ), info.keeping.voucher (เอกสาร), info.selling.voucher (เอกสาร)

### TVS
* contract-edit ปรับ running เลขสัญญา ประเภท บันทึก ให้ เอาเลขสัญญา ที่อ้างถึง ต่อท้ายด้วย .001
* contract-edit ชื่อผู้เช่า, ผู้ลงนาม ในสัญญา เก็บชื่อตรงกับ ชื่อในข้อมูล ผู้เช่า ไม่เอาคำนำหน้า มาปะเพิ่ม

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
* controllers/legacy-list - move action buttons to dropdown menu

### TVS
* tvs/contract-edit - incorrect duration + rental_date calculation example "1 เดือน" + "01/09/2556" = "01/10/2556"
* tvs/app-route - exclude from tvs/project to new file
* views/tvs/contract-print/tof.html - typo mistake custom().code

### NPD
* npd/voucher-edit - begin implement post/cancel/unpost
* npd/project - adminView.actions - return actions that depend on data e.g. if approved then can post, if posted then can unpost

## 2013-9-9
* controller/legacy-edit - merge timestamp info created / modified during save data
* controller/legacy-edit - concurrent edit support, check conflict with modified time before save
