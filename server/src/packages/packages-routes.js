const express = require("express");
const { createPackageByAdmin, getPackagesByAdminWithPagination ,updatePackageByAdmin ,deletePackagesByAdmin ,getPackagesByCategory ,getAllPackages} = require("./packages-controller");
const router = express.Router();


router.post("/create-package-by-admin", createPackageByAdmin);

router.get("/get-packages-by-admin-with-pagination", getPackagesByAdminWithPagination);

router.get("/get-All-packages", getAllPackages);

router.get("/get-packages-by-category/:id", getPackagesByCategory);

router.post("/update-package-by-admin/:id", updatePackageByAdmin);

router.get("/delete-packages-by-admin/:id", deletePackagesByAdmin);

module.exports = router;
