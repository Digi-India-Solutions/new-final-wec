const express = require('express');
const router = express.Router();

const { createSuperAdmin, superAdminLogin, sendResetPasswordEmail, resetPassword, createAdminByAdmin,getAdminUsersByAdmin,
    getAdminUsersByAdminwithPagination, updateAdminByAdmin, deleteAdminUserByAdmin, getDistributorsByAdmin, getRetailersByAdminwithPagination,
    getRetailersByDistributor ,getAllStaffByAdmin,getAdminUsersById ,getRetailerByEmail,getAllUserDataWithPagination,getTSMASMByAdmin ,getAllUserDataByTSMASMWithPagination } = require("./super-admin-controller.js");


/////////////////////////////////////// crud operation by admin ////////////////////////////////////////////////////
router.post("/create-admin-by-admin", createAdminByAdmin);

router.post("/admin-login", superAdminLogin);

router.get("/getAdminUsersByAdminwithPagination", getAdminUsersByAdminwithPagination);

router.get("/get-All-Users-By-Admin", getAdminUsersByAdmin);

router.get("/getAllUserDataWithPagination", getAllUserDataWithPagination);

router.get("/getAllUserDataByTSMASMWithPagination", getAllUserDataByTSMASMWithPagination);

router.get("/getRetailersByAdminwithPagination", getRetailersByAdminwithPagination);

router.get("/getDistributorsByAdmin", getDistributorsByAdmin);

router.get("/getTSMASMByAdmin", getTSMASMByAdmin);

router.get("/getRetailersByDistributorwithPagination", getRetailersByDistributor);

router.post("/update-admin-by-admin/:id", updateAdminByAdmin);

router.get("/delete-admin-user-by-admin/:id", deleteAdminUserByAdmin);

router.get("/get-all-staff-by-admin", getAllStaffByAdmin)

router.get("/get-admin-users-by-id/:id", getAdminUsersById)

router.get("/get-reteailer-by-email", getRetailerByEmail)

router.post("/send-reset-password-email", sendResetPasswordEmail);

router.post("/reset-password", resetPassword);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/create-admin", createSuperAdmin);








// router.post("/update-super-admin/:id", updateSuperAdminByID);

// router.post("/change-password-super-admin/:id", changePassword);

// router.post("/send-otp-for-change-email", sendOtpForChangeEmail);

// router.post("/verify-otp-for-change-email", verifyOtpForChangeEmail);

// router.post("/send-otp-for-change-phone", sendOtpForChangePhone);

// router.post("/verify-otp-for-change-phone", verifyOtpForChangePhone);


module.exports = router;