"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStatus = exports.MessageType = exports.ReportReason = exports.ReportStatus = exports.PaymentStatus = exports.FilterType = exports.CategoryStatus = exports.SellerPlan = exports.AdvertisementType = exports.AdvertisementStatus = exports.Gender = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
var AdvertisementStatus;
(function (AdvertisementStatus) {
    AdvertisementStatus["PENDING"] = "PENDING";
    AdvertisementStatus["DRAFT"] = "DRAFT";
    AdvertisementStatus["ACTIVE"] = "ACTIVE";
    AdvertisementStatus["INACTIVE"] = "INACTIVE";
    AdvertisementStatus["ARCHIVED"] = "ARCHIVED";
})(AdvertisementStatus || (exports.AdvertisementStatus = AdvertisementStatus = {}));
var AdvertisementType;
(function (AdvertisementType) {
    AdvertisementType["SERVICE"] = "SERVICE";
    AdvertisementType["RENTAL"] = "RENTAL";
})(AdvertisementType || (exports.AdvertisementType = AdvertisementType = {}));
var SellerPlan;
(function (SellerPlan) {
    SellerPlan["STANDARD"] = "STANDARD";
    SellerPlan["PLUS"] = "PLUS";
    SellerPlan["PRO"] = "PRO";
    SellerPlan["FIRMA"] = "FIRMA";
})(SellerPlan || (exports.SellerPlan = SellerPlan = {}));
var CategoryStatus;
(function (CategoryStatus) {
    CategoryStatus["ACTIVE"] = "ACTIVE";
    CategoryStatus["DRAFT"] = "DRAFT";
    CategoryStatus["INACTIVE"] = "INACTIVE";
})(CategoryStatus || (exports.CategoryStatus = CategoryStatus = {}));
var FilterType;
(function (FilterType) {
    FilterType["TEXT"] = "TEXT";
    FilterType["NUMBER"] = "NUMBER";
    FilterType["SELECT"] = "SELECT";
    FilterType["MULTISELECT"] = "MULTISELECT";
    FilterType["BOOLEAN"] = "BOOLEAN";
    FilterType["DATE"] = "DATE";
    FilterType["RANGE"] = "RANGE";
})(FilterType || (exports.FilterType = FilterType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "PENDING";
    ReportStatus["RESOLVED"] = "RESOLVED";
    ReportStatus["DISMISSED"] = "DISMISSED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportReason;
(function (ReportReason) {
    ReportReason["SPAM"] = "SPAM";
    ReportReason["INAPPROPRIATE"] = "INAPPROPRIATE";
    ReportReason["FAKE"] = "FAKE";
    ReportReason["SCAM"] = "SCAM";
    ReportReason["COPYRIGHT"] = "COPYRIGHT";
    ReportReason["OTHER"] = "OTHER";
})(ReportReason || (exports.ReportReason = ReportReason = {}));
var MessageType;
(function (MessageType) {
    MessageType["INQUIRY"] = "INQUIRY";
    MessageType["SYSTEM"] = "SYSTEM";
    MessageType["BAN_NOTIFICATION"] = "BAN_NOTIFICATION";
    MessageType["VIOLATION"] = "VIOLATION";
    MessageType["AD_APPROVED"] = "AD_APPROVED";
    MessageType["AD_REJECTED"] = "AD_REJECTED";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["UNREAD"] = "UNREAD";
    MessageStatus["READ"] = "READ";
    MessageStatus["ARCHIVED"] = "ARCHIVED";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
//# sourceMappingURL=index.js.map