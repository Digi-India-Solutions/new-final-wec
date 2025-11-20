const express = require("express");
const router = express.Router();
const upload = require('../../middleware/multer');

const { createAmcByAdmin ,getAmcByAdminWithPagination,downloadExcelWec } = require("./user-admin-wec-controller");



router.post("/create-amc-by-admin", upload.fields([{ name: "productPicture", maxCount: 8 }, { name: "purchaseProof", maxCount: 1 }]), createAmcByAdmin);

router.get("/get-amc-by-admin-with-pagination", getAmcByAdminWithPagination);

router.get("/download-excel-wec", downloadExcelWec);
// router.get("/get-amc-by-retailer-with-pagination/:id", getAmcByRetailerWithPagination);

// router.get("/get-amc-by-distributor-with-pagination/:id", getAmcByDistributorWithPagination);

// router.get("/get-amc-by-customer", getAmcByCustomer);

// // router.post("/update-amc-by-admin/:id", upload.single("purchaseProof"), updateAmcByAdmin);

// router.get("/delete-amc-by-admin/:id", deleteAmcByAdmin);

module.exports = router;
