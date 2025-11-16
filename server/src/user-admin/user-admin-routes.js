const express = require('express');
const router = express.Router();

const {
    createUserAdminByAdmin,
    getUserAdminUsersByAdminwithPagination,
    updateUserAdminByAdmin,
    deleteUserAdminUserByAdmin,
    UserAdminLogin,
    getUserByEmailAndName,
    updateUserAdminByEmailAndName,
    //     sendResetPasswordEmail,
    //     resetPassword,
    //     createAdminByAdmin,
    //     getDistributorsByAdmin,
    //     getRetailersByAdminwithPagination,
    //     getRetailersByDistributor,
    //     getAllStaffByAdmin,
    getUserAdminUsersById
} = require("./user-admin-controller.js");


/////////////////////////////////////// crud operation by admin ////////////////////////////////////////////////////
router.post("/create-user-admin-by-admin", createUserAdminByAdmin);

router.post("/user-admin-login", UserAdminLogin);

router.get("/getUserAdminUsersByAdminwithPagination", getUserAdminUsersByAdminwithPagination);

// router.get("/getRetailersByAdminwithPagination", getRetailersByAdminwithPagination);

// router.get("/getDistributorsByAdmin", getDistributorsByAdmin);

// router.get("/getRetailersByDistributorwithPagination", getRetailersByDistributor);

router.post("/update-user-admin-by-admin/:id", updateUserAdminByAdmin);

router.get("/delete-user-admin-user-by-admin/:id", deleteUserAdminUserByAdmin);

// router.get("/get-all-staff-by-admin", getAllStaffByAdmin)

router.get("/get-user-admin-users-by-id/:id", getUserAdminUsersById)

// router.post("/send-reset-password-email", sendResetPasswordEmail);

// router.post("/reset-password", resetPassword);

router.get("/get-user-by-email-and-name", getUserByEmailAndName)

router.post("/update-user-admin-by-email-and-name/:id", updateUserAdminByEmailAndName)
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;