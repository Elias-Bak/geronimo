'use strict';

/* App Variables */
var PARAMS = {
    UserTypes: 101,
    UserStatus: 102,
    UserPrivileges: 103,
    PrintSetup: 104,
    Languages: 105,
    CompanyTypes: 201,
    CompanyCategories: 202,
    BranchTypes: 203,
    BranchCountries: 204,
    ContactPositions: 205,
    ContactTitles: 206,
    ContactDepartments: 207,
    CoordinateTypes: 208,
    CoordinateCategories: 209,
    CompanyTerms: 210,
    LedgerTypes: 211,
    LedgerCategories: 212,
    LedgerAccounts: 213,
    DueDateTerms: 214,
    ItemTypes: 301,
    ItemCategories: 302,
    ItemBrands: 303,
    ItemStatus: 304,
    AmountTypes: 305,
    AmountCategories: 306,
    QuantityTypes: 307,
    QuantityWarehouses: 308,
    QuantityLocations: 309,
    QuantitySizes: 310,
    QuantityColors: 311,
    QuantityUnits: 312,
    PackageTypes: 313,
    ImageTypes: 314,
    TaxRates: 315,
    TransactionTypes: 401,
    TransactionStatus: 402,
    TransactionCurrencies: 403,
    TransactionAccounts: 404,
    TransactionDateRange: 405,
    TransactionTaxAmounts: 406,
    TransactionDefaults: 407,
    TransactionPayments: 408,
    TransactionFormTypes: 409,
    ReportsLabels: 500,
    TransactionsReport: 501,
    GeneralJournalReport: 502,
    AccountsBalancesReport: 503,
    ItemMovementsReport: 504,
    InventoryValueReport: 505
};
var groups_by_id = Object();
var groups_by_cat = Object();
var params_by_id = Object();
var params_by_group = Object();
var params_by_code = Object();
var language = window.navigator.userLanguage || window.navigator.language;
var loading = true;
var currentModule = 0;

//var encryptData = true;
var encryptData = false;

function JsonToString(json) {
    //var str = angular.toJson(json, 0);
    var str = JSON.stringify(json);
    //console.log("01 str: [" + str + "]");
    if (encryptData) {
        str = window.btoa(unescape(encodeURIComponent(str)));
    }
    //console.log("02 str: [" + str + "]");
    return str;
}

function StringToJson(data) {
    //console.log("10 str: [" + data + "]");    
    if (encryptData) {
        var str = window.atob(data);
        //console.log("11 str: [" + str + "]");
        str = JSON.parse(str);
        //console.log("12 str: [" + str + "]");
        return str;
    } else {
        return data;
    }
}

/* App Module */
var quickcountApp = angular.module('QuickCountApp', ['ngRoute', 'googlechart', 'base64', 'ngCookies']);
quickcountApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
                when('/dashboard', {
                    templateUrl: 'partials/dashboard.html',
                    controller: 'DashboardCtrl'
                }).
                when('/account', {
                    templateUrl: 'partials/account.html',
                    controller: 'AccountCtrl'
                }).
                when('/inventory', {
                    templateUrl: 'partials/inventory.html',
                    controller: 'InventoryCtrl'
                }).
                when('/transaction', {
                    templateUrl: 'partials/transaction.html',
                    controller: 'TransactionCtrl'
                }).
                when('/trans_items', {
                    templateUrl: 'partials/trans_items.html',
                    controller: 'TransItemsCtrl'
                }).
                when('/report', {
                    templateUrl: 'partials/report.html',
                    controller: 'ReportCtrl'
                }).
                when('/parameter', {
                    templateUrl: 'partials/parameter.html',
                    controller: 'ParameterCtrl'
                }).
                when('/login', {
                    templateUrl: 'partials/login.html',
                    controller: 'LoginCtrl'
                }).
                when('/logout', {
                    templateUrl: 'partials/logout.html',
                    controller: 'LogoutCtrl'
                }).
                when('/user', {
                    templateUrl: 'partials/user.html',
                    controller: 'UserCtrl'
                }).
                when('/empty', {
                    templateUrl: 'partials/empty.html',
                    controller: 'EmptyCtrl'
                }).
                otherwise({
                    redirectTo: '/dashboard'
                });
    }]);

quickcountApp.controller('QuickCountCtrl', function ($scope, $http, $filter, $location, $cookies, $locale) {

    // Message text variables
    $scope.msg_title = '';
    $scope.msg_body = '';

    // Function for getting the current active module
    $scope.activeModule = function (id) {
        if (id === currentModule) {
            return "active";
        }
        return "";
    };

    // Language
    $scope.isRTL = false;
    $scope.lang_code = "";
    if (typeof (Storage) !== "undefined") {
        $scope.lang_code = localStorage.getItem("lang_code");
    }
    if (!$scope.lang_code) {
        $scope.lang_code = $locale.id.substring(0, 2);
    }
    if ($scope.lang_code === 'ar' || $scope.lang_code === 'iw') {
        var body_main = document.getElementById('body_main');
        if (body_main) {
            body_main.style.direction = 'rtl';
            $scope.isRTL = true;
        }
    }
    $scope.$watch('lang_code', function () {
        if (typeof (Storage) !== "undefined") {
            if ($scope.lang_code !== localStorage.getItem("lang_code")) {
                localStorage.setItem("lang_code", $scope.lang_code);
                location.reload();
            }
        }
    });

    // Retrieving login session variables
    $scope.user_logged = false;
    $scope.user_id = "0";
    $scope.user_name = "";
    $scope.user_email = "";
    $scope.user_image_url = "";
    $scope.user_auth_token = "";
    $scope.user_type_id = "0";
    $scope.comp_code = "";
    $scope.comp_name = "";

    if (typeof (Storage) !== "undefined") {
        $scope.user_logged = sessionStorage.getItem("user_logged") === "true";
        $scope.user_id = sessionStorage.getItem("user_id");
        $scope.user_name = sessionStorage.getItem("user_name");
        $scope.user_image_url = sessionStorage.getItem("user_image_url");
        $scope.user_email = sessionStorage.getItem("user_email");
        $scope.user_auth_token = sessionStorage.getItem("user_auth_token");
        $scope.user_type_id = sessionStorage.getItem("user_type_id");
        $scope.comp_code = sessionStorage.getItem("comp_code");
        $scope.comp_name = sessionStorage.getItem("comp_name");
    } else {
        $scope.user_logged = $cookies.get("user_logged") === "true";
        $scope.user_id = $cookies.get("user_id");
        $scope.user_name = $cookies.get("user_name");
        $scope.user_image_url = $cookies.get("user_image_url");
        $scope.user_email = $cookies.get("user_email");
        $scope.user_auth_token = $cookies.get("user_auth_token");
        $scope.user_type_id = $cookies.get("user_type_id");
        $scope.comp_code = $cookies.get("comp_code");
        $scope.comp_name = $cookies.get("comp_name");
    }

    $scope.date_today = $filter('date')(Date.now(), 'yyyy-MM-dd');
    console.log("QuickCountCtrl - User logged: "
            + $scope.user_logged + "  ID: " + $scope.user_id
            + "  code: '" + $scope.comp_code
            + "'  today: " + $scope.date_today
            + " with language locale '" + $scope.lang_code + "' (" + $locale.id + ") module: " + currentModule);

    // Active module for sidebar
    if (!$scope.user_logged) {
        // Redirecting the login page
        $location.path('/login');
        return;
    } else if ($scope.comp_code === null || $scope.comp_code.length === 0) {
        // Loading parameters if not already loaded (or empty)
        if (Object.keys(params_by_group).length === 0) {
            console.log("Checking user credentials for user '" + $scope.user_email + "'");
            var select_sql = {
                select: ["gu.id id", "gu.type_id type_id", "gu.status_id status_id", "DATE_FORMAT(gu.expiry_date, '%Y-%m-%d') expiry_date", "gu.name name", "gu.email email", "gu.note note", "gu.company_id comp_id", "gc.code comp_code", "gc.name comp_name", "gc.language_id lang_id"],
                table: ["geronimo_user gu LEFT JOIN geronimo_company gc ON gu.company_id = gc.id"],
                condition: ["email = '" + $scope.user_email + "'"],
                order: [],
                limit: []
            };
            $http.post("../../php/select.php", JsonToString(select_sql))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[1003] Error occurred while querying the database");
                            return;
                        }
                        if (response.length === 0) {
                            $scope.msg_title = 'Email not available';
                            $scope.msg_body = "Email '" + $scope.user_email + "' does not exist in Geronimo database!";
                            $("#messageModal").modal("show");
                            return;
                        }

                        // Checking company code of current user
                        console.log("comp_code: " + response[0].comp_code + " and comp_id: " + response[0].comp_id);
                        if (response[0].comp_code === null || response[0].comp_code.length === 0 || response[0].comp_id === 0) {
                            //alert("Current user does not have any company linked to his account!");
                            $scope.msg_title = 'Company not available';
                            $scope.msg_body = 'Current user does not have any company linked to his account!';
                            $("#messageModal").modal("show");
                            $location.path('/logout');
                            return;
                        }

                        // Session timeout
                        var expiryDate = new Date();
                        var expiryTime = expiryDate.getTime() + (1000 * 60 * 60 * 7); // 7 hours
                        expiryDate.setTime(expiryTime);

                        // Setting company code and type of current user                        
                        $scope.user_type_id = response[0].type_id;
                        $scope.comp_code = response[0].comp_code + "_";
                        $scope.comp_name = response[0].comp_name;
                        $scope.lang_id = response[0].lang_id;
                        if (typeof (Storage) !== "undefined") {
                            sessionStorage.setItem("user_type_id", $scope.type_id);
                            sessionStorage.setItem("comp_code", $scope.comp_code);
                            sessionStorage.setItem("comp_name", $scope.comp_name);
                            sessionStorage.setItem("lang_id", $scope.lang_id);
                        } else {
                            $cookies.put('user_type_id', $scope.type_id, {'expires': expiryDate});
                            $cookies.put('comp_code', $scope.comp_code, {'expires': expiryDate});
                            $cookies.put('comp_name', $scope.comp_name, {'expires': expiryDate});
                            $cookies.put('lang_id', $scope.lang_id, {'expires': expiryDate});
                        }

                        // Google Analytics
                        // Set the user ID using signed-in user_id.
                        ga('set', 'userId', response[0].comp_code + "_" + response[0].id);

                        // loading parameters
                        loading = true;
                        load_params($scope, $http, $filter, $location, $cookies, $locale);

                        // redirecting to default page
                        $location.path('/dashboard');
                    });
        }
    } else { // Loading parameters if not already loaded (or empty)
        if (Object.keys(params_by_group).length === 0) {
            loading = true;
            load_params($scope, $http, $filter, $location, $cookies, $locale);
        }
    }
});

function load_params($scope, $http, $filter, $location, $cookies, $locale) {
    // Load parameters groups
    var select_sql = {
        language: $scope.lang_code,
        code: $scope.comp_code,
        select: ["id", "type_id", "category_id", "language_id", "code", "name", "description", "note"],
        table: [$scope.comp_code + "parameter_group"],
        condition: ["status_id = '1'"],
        order: ["category_id, name"],
        limit: []
    };

    //$http.get("../../php/select.php?params=" + JsonToString(select_sql))
    $http.post("../../php/select.php", JsonToString(select_sql))
            .success(function (response) {
                response = StringToJson(response);
                if (!angular.isArray(response)) {
                    alert("[1001] Error occurred while querying the database");
                    return;
                }
                for (var i = 0; i < response.length; i++) {
                    groups_by_id[response[i].id] = response[i];
                    if (!groups_by_cat.hasOwnProperty(response[i].category_id)) {
                        groups_by_cat[response[i].category_id] = [];
                    }
                    groups_by_cat[response[i].category_id].push(response[i]);
                }
                $scope.groups_list = response;
                $scope.groups_by_id = groups_by_id;
                $scope.groups_by_cat = groups_by_cat;
                //console.log("00 groups: " + Object.keys(response).length);
                //console.log("00 groups_by_id: " + Object.keys(groups_by_id).length);
                //console.log("00 groups_by_cat: " + Object.keys(groups_by_cat).length);
            });

    // Load all parameters entries
    var select_sql = {
        language: $scope.lang_code,
        code: $scope.comp_code,
        select: ["id", "group_id", "type_id", "option_id", "code", "name", "value", "description", "note"],
        table: [$scope.comp_code + "parameter_entry"],
        condition: [],
        order: ["group_id, id"],
        limit: []
    };

    //$http.get("../../php/select.php?params=" + JsonToString(select_sql))
    $http.post("../../php/select.php", JsonToString(select_sql))
            .success(function (response) {
                response = StringToJson(response);
                if (!angular.isArray(response)) {
                    alert("[1001] Error occurred while querying the database");
                    return;
                }
                for (var i = 0; i < response.length; i++) {
                    // Selecting language value
                    if ($scope.lang_code && response[i].name && response[i].name.startsWith("{")) {
                        try {
                            var json = JSON.parse(response[i].name);
                            if (angular.isObject(json)) {
                                if (json.hasOwnProperty($scope.lang_code)) {
                                    response[i].name = json[$scope.lang_code];
                                }
                            }
                        } catch (err) {
                            console.log(response[i].id + " - parameter name (error): " + response[i].value);
                            console.log(err);
                        }
                    }
                    if ($scope.lang_code && response[i].value && response[i].value.startsWith("{")) {
                        try {
                            var json = JSON.parse(response[i].value);
                            if (angular.isObject(json)) {
                                if (json.hasOwnProperty($scope.lang_code)) {
                                    response[i].value = json[$scope.lang_code];
                                }
                            }
                        } catch (err) {
                            console.log(response[i].id + " - parameter value (error): " + response[i].value);
                            console.log(err);
                        }
                    }
                    if ($scope.lang_code && response[i].description && response[i].description.startsWith("{")) {
                        try {
                            var json = JSON.parse(response[i].description);
                            if (angular.isObject(json)) {
                                if (json.hasOwnProperty($scope.lang_code)) {
                                    response[i].description = json[$scope.lang_code];
                                }
                            }
                        } catch (err) {
                            console.log(response[i].id + " - parameter description (error): " + response[i].value);
                            console.log(err);
                        }
                    }
                    if ($scope.lang_code && response[i].note && response[i].note.startsWith("{")) {
                        try {
                            var json = JSON.parse(response[i].note);
                            if (angular.isObject(json)) {
                                if (json.hasOwnProperty($scope.lang_code)) {
                                    response[i].note = json[$scope.lang_code];
                                }
                            }
                        } catch (err) {
                            console.log(response[i].id + " - parameter note (error): " + response[i].value);
                            console.log(err);
                        }
                    }
                    // Map with key parameter ID
                    params_by_id[response[i].id] = response[i];
                    // Group ID used as object key
                    if (!params_by_group.hasOwnProperty(response[i].group_id)) {
                        params_by_group[response[i].group_id] = [];
                        params_by_group[response[i].group_id].push({id: '0', code: '', name: '<Not Selected>'});
                    }
                    params_by_group[response[i].group_id].push(response[i]);
                    // Code used as object key
                    if (response[i].code !== null && String(response[i].code).length > 0) {
                        params_by_code[response[i].code] = response[i];
                        //console.log(i + " response[i].code: " + response[i].code);
                    }
                }
                $scope.params = params_by_id;
                $scope.groups = params_by_group;
                $scope.paramTransactionTypes = params_by_group[PARAMS.TransactionTypes];
                $scope.paramTransactionStatus = params_by_group[PARAMS.TransactionStatus];
                $scope.paramQuantityUnits = params_by_group[PARAMS.QuantityUnits];
                $scope.paramTransactionCurrencies = params_by_group[PARAMS.TransactionCurrencies];
                $scope.paramTransactionTaxAmounts = params_by_group[PARAMS.TransactionTaxAmounts];
                $scope.paramTransactionPayments = params_by_group[PARAMS.TransactionPayments];
                $scope.paramTaxRates = params_by_group[PARAMS.TaxRates];
                $scope.paramItemTypes = params_by_group[PARAMS.ItemTypes];
                $scope.paramCompanyTypes = params_by_group[PARAMS.CompanyTypes];
                $scope.paramBranchCountries = params_by_group[PARAMS.BranchCountries];
                $scope.paramContactTitles = params_by_group[PARAMS.ContactTitles];
                $scope.paramDueDateTerms = params_by_group[PARAMS.DueDateTerms];
                $scope.paramReportsLabels = params_by_group[PARAMS.ReportsLabels];
                $scope.paramLanguages = params_by_group[PARAMS.Languages];
//                $scope.paramTransactionsReport = params_by_group[PARAMS.TransactionsReport];
//                $scope.paramGeneralJournalReport = params_by_group[PARAMS.GeneralJournalReport];
//                $scope.paramAccountsBalancesReport = params_by_group[PARAMS.AccountsBalancesReport];
//                $scope.paramItemMovementsReport = params_by_group[PARAMS.ItemMovementsReport];
//                $scope.paramInventoryValueReport = params_by_group[PARAMS.InventoryValueReport];

//                console.log("00 params_by_id: " + params_by_id.length);
//                console.log("00 params_by_group: " + params_by_group.length);
//                console.log("00 params_by_code: " + params_by_code.length);
//                console.log("00 params_by_id: " + Object.keys(params_by_id).length);
//                console.log("00 params_by_group: " + Object.keys(params_by_group).length);
//                console.log("00 params_by_code: " + Object.keys(params_by_code).length);

                // Reports data
                $scope.table_header = new Object();
                if ($scope.params.hasOwnProperty("500001")) {
                    $scope.table_header["500001"] = [
                        {value: $scope.params["510001"].value, align: "center", class: ""},
                        {value: $scope.params["510002"].value, align: "left", class: "col_hide"},
                        {value: $scope.params["510003"].value, align: "center", class: "col_hide"},
                        {value: $scope.params["510004"].value, align: "left", class: ""},
                        {value: $scope.params["510005"].value, align: "end", class: ""},
                        {value: $scope.params["510006"].value, align: "center", class: ""},
                        {value: $scope.params["510007"].value, align: "center", class: "col_hide"}
                    ];
                }
                if ($scope.params.hasOwnProperty("500002")) {
                    $scope.table_header["500002"] = [
                        {value: $scope.params["520001"].value, align: "center"},
                        {value: $scope.params["520002"].value, align: "center"},
                        {value: $scope.params["520003"].value, align: "center", class: "col_hide"},
                        {value: $scope.params["520004"].value, align: "left"},
                        {value: $scope.params["520005"].value, align: "end"},
                        {value: $scope.params["520006"].value, align: "center"},
                        {value: $scope.params["520008"].value, align: "center", class: "col_hide"}
                    ];
                }
                if ($scope.params.hasOwnProperty("500003")) {
                    $scope.table_header["500003"] = [
                        {value: $scope.params["530001"].value, align: "center"},
                        {value: $scope.params["530002"].value, align: "left"},
                        {value: $scope.params["530003"].value, align: "end"},
                        {value: $scope.params["530004"].value, align: "center"},
                        {value: $scope.params["530005"].value, align: "center", class: "col_hide"}
                    ];
                }
                if ($scope.params.hasOwnProperty("500004")) {
                    $scope.table_header["500004"] = [
                        {value: $scope.params["540001"].value, align: "center"},
                        {value: $scope.params["540002"].value, align: "center", class: "col_hide"},
                        {value: $scope.params["540003"].value, align: "center", class: "col_hide"},
                        {value: $scope.params["540004"].value, align: "left", class: "col_hide"},
                        {value: $scope.params["540005"].value, align: "left"},
                        {value: $scope.params["540006"].value, align: "center"},
                        {value: $scope.params["540007"].value, align: "end"},
                        {value: $scope.params["540008"].value, align: "end"},
                        {value: $scope.params["540009"].value, align: "center", class: "col_hide"}
                    ];
                }
                if ($scope.params.hasOwnProperty("500005")) {
                    $scope.table_header["500005"] = [
                        {value: $scope.params["550001"].value, align: "left", class: "col_hide"},
                        {value: $scope.params["550002"].value, align: "center"},
                        {value: $scope.params["550003"].value, align: "left"},
                        {value: $scope.params["550004"].value, align: "center"},
                        {value: $scope.params["550005"].value, align: "end"},
                        {value: $scope.params["550006"].value, align: "center", class: "col_hide"}
                    ];
                }
                if ($scope.params.hasOwnProperty("500006")) {
                    $scope.table_header["500006"] = [
                        {value: $scope.params["560001"].value, align: "center"},
                        {value: $scope.params["560002"].value, align: "center", class: "col_hide"},
                        {value: $scope.params["560003"].value, align: "center", class: "col_hide"},
                        {value: $scope.params["560004"].value, align: "left", class: "col_hide"},
                        {value: $scope.params["560005"].value, align: "left"},
                        {value: $scope.params["560006"].value, align: "center"},
                        {value: $scope.params["560007"].value, align: "end"},
                        {value: $scope.params["560008"].value, align: "center", class: "col_hide"}
                    ];
                }

                // All info loaded                
                loading = false;

                // Reloading current page
                console.log("QuickCountCtrl - reloading module: " + currentModule);
                var nextModule = currentModule;
                currentModule = 0;
                if (nextModule === 10) {
                    $location.path('/dashboard');
                } else if (nextModule === 20) {
                    $location.path('/account');
                } else if (nextModule === 30) {
                    $location.path('/inventory');
                } else if (nextModule === 40) {
                    $location.path('/transaction');
                } else if (nextModule === 50) {
                    $location.path('/report');
                } else if (nextModule === 60) {
                    $location.path('/parameter');
                } else {
                    $location.path('/');
                }
                
            });
}
;
