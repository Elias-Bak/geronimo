'use strict';

quickcountApp.controller('ReportCtrl', function ($scope, $http, $filter, $location, $cookies) {

    // Check if currently loading parameters
    if (loading) {
        //console.log("ReportCtrl - loading: " + loading);
        currentModule = 50;
        $location.path('/empty');
        return;
    }

    // Module
    if (currentModule === 50) {
        return;
    }
    currentModule = 50;
    
    // Retrieving user login session variables
    console.log("ReportCtrl - user logged: " + $scope.$parent.user_logged 
            + "  user id: " + $scope.$parent.user_id
            + "  company code: " + $scope.$parent.comp_code);
    if (!$scope.$parent.user_logged) {
        $location.path('/login');
        return;
    }

    // Company table prefix code
    if ($scope.$parent.comp_code === null || $scope.$parent.comp_code.length === 0) {
        $location.path('/logout');
        $scope.msg_title = 'Company not available';
        $scope.msg_body = 'Company code for current user is not available. Please login with a different user!';
        $("#messageModal").modal("show");
        return;
    }
    
    // Google Analytics
    ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
    ga('send', {
        hitType: 'event',
        eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
        eventAction: 'Menu Button - Reports',
        eventLabel: 'Reports List'
    });

    // Message text variables
    $scope.msg_title = '';
    $scope.msg_body = '';
    $scope.error_code_type = "";
    $scope.error_code_sign = "";
    $scope.error_name_type = "";
    $scope.error_name_sign = "";

    // Reports display variables
    $scope.show_report_list = true;
    $scope.report_id = 0;
    $scope.report_title = "";

    // Form data variables
    $scope.entries = [];
    $scope.totals = new Object();
    $scope.totals_desc = "";
            
    $scope.trans_date_from = new Date();
    $scope.trans_date_to = new Date();

    // Show selected report
    $scope.showSelectedReport = function (id) {
        // Results filtering options
        $scope.trans_type_id = "0";
        $scope.trans_number = "";
        $scope.trans_date_from = new Date();
        $scope.trans_date_to = new Date();
        $scope.trans_ledger = "";
        $scope.trans_account = "";
        $scope.item_code = "";
        $scope.item_name = "";
        $scope.comp_type_id = "0";
        $scope.comp_id = "";
        $scope.comp_code = "";
        $scope.comp_name = "";
        $scope.zero_balance = false;

        // Display selected report
        $scope.show_report_list = false;
        $scope.report_id = Number(id);
        $scope.report_title = $scope.params[id].value;
        $scope.entries = [];
        $scope.totals = new Object();
        $scope.search(Number(id));
    };

    // Show report list
    $scope.showReportList = function () {
        $scope.show_report_list = true;
        $scope.report_id = 0;
        $scope.report_title = "";
    };

    // Search result query
    var sql_query = {};
    $scope.search = function () {
        if ($scope.report_id === 500001) { // contacts balances
            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Reports',
                eventLabel: 'Report Search - ' + $scope.params[$scope.report_id.toString()].value
            });
            // Filtering conditions
            var condition = [];
            condition.push("tro.company_id > 0");
            if (Number($scope.comp_type_id) > 0) {
                condition.push("ac.type_id = " + $scope.comp_type_id);
            }
            if (Number($scope.comp_id) > 0) {
                condition.push("ac.id = " + $scope.comp_id);
            }
            if ($scope.comp_name.length > 0) {
                condition.push("ac.name LIKE '%" + $scope.comp_name + "%'");
            }
            if ($scope.comp_code.length > 0) {
                condition.push("ac.code LIKE '" + $scope.comp_code + "%'");
            }
            var having = [];
            if (!$scope.zero_balance) {
                having.push("balance != 0");
            }
            // Main select query
            sql_query = {
                select: ["tro.company_id company_id", "tro.currency_id currency_id", "ac.type_id company_type_id", "ac.code company_code", "ac.name company_name", "(sum(tro.debit) - sum(tro.credit)) balance", "pe3.name company_type", "pe4.name currency_name"],
                table: [$scope.$parent.comp_code + "transaction_journal tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
                condition: condition,
                group: ["tro.company_id", "tro.currency_id"],
                having: having,
                order: ["company_code", "company_name", "pe4.name"],
                limit: []
            };
            //$http.get("../../php/select.php?params=" + JsonToString(sql_query))
            $http.post("../../php/select.php", JsonToString(sql_query))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[$scope.report_id] Error occurred while querying the database");
                            return false;
                        }
                        $scope.entries = response;
                        $scope.setTotalAmounts();
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        } else if ($scope.report_id === 500002) { // transactions
            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Reports',
                eventLabel: 'Report Search - ' + $scope.params[$scope.report_id.toString()].value
            });
            // Filtering conditions
            var condition = [];
            if (Number($scope.trans_type_id) > 0) {
                condition.push("tro.type_id = " + $scope.trans_type_id);
            }
            if ($scope.comp_name.length > 0) {
                condition.push("ac.name LIKE '%" + $scope.comp_name + "%'");
            }
            if ($scope.trans_number.length > 0) {
                condition.push("tro.number LIKE '" + $scope.trans_number + "%'");
            }
            if ($scope.trans_date_from) {
                condition.push("tro.date >= '" + $filter('date')($scope.trans_date_from, "yyyy-MM-dd") + "'");
            }
            if ($scope.trans_date_to) {
                condition.push("tro.date <= '" + $filter('date')($scope.trans_date_to, "yyyy-MM-dd") + "'");
            }
            // Main select query
            sql_query = {
                select: ["tro.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "tro.due_date due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe2.name status_name", "tro.price price", "tro.discount discount", "tro.subtotal subtotal", "tro.expense expense", "tro.total total", "tro.tax tax", "tro.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "pe4.name currency_name"],
                table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
                condition: condition,
                order: ["tro.date", "tro.number"],
                limit: []
            };
            //$http.get("../../php/select.php?params=" + JsonToString(sql_query))
            $http.post("../../php/select.php", JsonToString(sql_query))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[5002] Error occurred while querying the database");
                            return false;
                        }
                        $scope.entries = response;
                        $scope.setTotalAmounts();
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        } else if ($scope.report_id === 500003) { // accounts balances
            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Reports',
                eventLabel: 'Report Search - ' + $scope.params[$scope.report_id.toString()].value
            });
            // Filtering conditions
            var condition = [];
            if ($scope.trans_ledger.length > 0) {
                condition.push("pe2.code LIKE '" + $scope.trans_ledger + "%'");
            }
            if ($scope.trans_account.length > 0) {
                condition.push("pe2.name LIKE '%" + $scope.trans_account + "%'");
            }
            var having = [];
            if (!$scope.zero_balance) {
                having.push("balance != 0");
            }
            // Main select query
            sql_query = {
                select: ["tro.ledger_id AS ledger_id", "tro.currency_id currency_id", "pe2.code account_code", "pe2.name account_name", "(sum(tro.debit) - sum(tro.credit)) balance", "pe4.name currency_name"],
                table: [$scope.$parent.comp_code + "transaction_journal tro LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.ledger_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
                condition: condition,
                group: ["tro.ledger_id", "tro.currency_id"],
                having: having,
                order: ["pe2.code", "pe2.name", "pe4.name"],
                limit: []
            };
            //$http.get("../../php/select.php?params=" + JsonToString(sql_query))
            $http.post("../../php/select.php", JsonToString(sql_query))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[5003] Error occurred while querying the database");
                            return false;
                        }
                        $scope.entries = response;
                        $scope.setTotalAmounts();
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        } else if ($scope.report_id === 500004) { // general journal
            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Reports',
                eventLabel: 'Report Search - ' + $scope.params[$scope.report_id.toString()].value
            });
            // Filtering conditions
            var condition = [];
            if (Number($scope.trans_type_id) > 0) {
                condition.push("tro.type_id = " + $scope.trans_type_id);
            }
            if ($scope.comp_name.length > 0) {
                condition.push("ac.name LIKE '%" + $scope.comp_name + "%'");
            }
            if ($scope.trans_number.length > 0) {
                condition.push("tro.number LIKE '" + $scope.trans_number + "%'");
            }
            if ($scope.trans_date_from) {
                condition.push("tro.date >= '" + $filter('date')($scope.trans_date_from, "yyyy-MM-dd") + "'");
            }
            if ($scope.trans_date_to) {
                condition.push("tro.date <= '" + $filter('date')($scope.trans_date_to, "yyyy-MM-dd") + "'");
            }
            if ($scope.trans_account.length > 0) {
                condition.push("pe2.name LIKE '%" + $scope.trans_account + "%'");
            }
            if ($scope.trans_ledger.length > 0) {
                condition.push("pe2.code LIKE '" + $scope.trans_ledger + "%'");
            }
            // Main select query
            sql_query = {
                select: ["tro.id id", "tro.company_id company_id", "tro.type_id type_id", "tro.order_id order_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "tro.currency_id currency_id", "ac.name company_name", "pe2.code account_code", "pe2.name account_name", "pe1.name type_name", "tro.debit debit", "tro.credit credit", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "pe4.name currency_name"],
                table: [$scope.$parent.comp_code + "transaction_journal tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.ledger_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
                condition: condition,
                order: ["tro.date", "tro.number"],
                limit: []
            };
            //$http.get("../../php/select.php?params=" + JsonToString(sql_query))
            $http.post("../../php/select.php", JsonToString(sql_query))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[5004] Error occurred while querying the database");
                            return false;
                        }
                        $scope.entries = response;
                        $scope.setTotalAmounts();
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        } else if ($scope.report_id === 500005) { // inventory value
            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Reports',
                eventLabel: 'Report Search - ' + $scope.params[$scope.report_id.toString()].value
            });
            // Filtering conditions
            var condition = [];
            condition.push("tro.item_id != 0");
            condition.push("tro.ledger_id = 213081");
            if (Number($scope.trans_type_id) > 0) {
                condition.push("invi.type_id = " + $scope.trans_type_id);
            }
            if ($scope.item_code.length > 0) {
                condition.push("invi.code LIKE '" + $scope.item_code + "%'");
            }
            if ($scope.item_name.length > 0) {
                condition.push("invi.name LIKE '%" + $scope.item_name + "%'");
            }
            if ($scope.trans_date_from) {
                condition.push("tro.date >= '" + $filter('date')($scope.trans_date_from, "yyyy-MM-dd") + "'");
            }
            if ($scope.trans_date_to) {
                condition.push("tro.date <= '" + $filter('date')($scope.trans_date_to, "yyyy-MM-dd") + "'");
            }
            // Main select query
            sql_query = {
                select: ["tro.ledger_id ledger_id", "tro.item_id item_id", "tro.currency_id currency_id", "invi.code item_code", "invi.name item_name", "pe2.code account_code", "pe2.name account_name", "sum(tro.quantity) quantity", "(sum(tro.debit) - sum(tro.credit)) balance", "invi.type_id item_type_id", "pe3.name item_type", "pe4.name currency_name"],
                table: [$scope.$parent.comp_code + "transaction_perpetual tro LEFT JOIN " + $scope.$parent.comp_code + "inventory_item invi ON tro.item_id = invi.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.ledger_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = invi.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
                condition: condition,
                group: ["tro.ledger_id", "tro.item_id", "tro.currency_id"],
                having: ["sum(tro.quantity) != 0"],
                order: ["pe2.code", "invi.code"],
                limit: []
            };
            //$http.get("../../php/select.php?params=" + JsonToString(sql_query))
            $http.post("../../php/select.php", JsonToString(sql_query))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[5001] Error occurred while querying the database");
                            return false;
                        }
                        $scope.entries = response;
                        $scope.setTotalAmounts();
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        } else if ($scope.report_id === 500006) { // item movements
            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Reports',
                eventLabel: 'Report Search - ' + $scope.params[$scope.report_id.toString()].value
            });
            // Filtering conditions
            var condition = [];
            if (Number($scope.trans_type_id) > 0) {
                condition.push("tro.type_id = " + $scope.trans_type_id);
            }
            if ($scope.comp_name.length > 0) {
                condition.push("ac.name LIKE '%" + $scope.comp_name + "%'");
            }
            if ($scope.trans_number.length > 0) {
                condition.push("tro.number LIKE '" + $scope.trans_number + "%'");
            }
            if ($scope.trans_date_from) {
                condition.push("tro.date >= '" + $filter('date')($scope.trans_date_from, "yyyy-MM-dd") + "'");
            }
            if ($scope.trans_date_to) {
                condition.push("tro.date <= '" + $filter('date')($scope.trans_date_to, "yyyy-MM-dd") + "'");
            }
            if ($scope.item_code.length > 0) {
                condition.push("invi.code LIKE '" + $scope.item_code + "%'");
            }
            if ($scope.item_name.length > 0) {
                condition.push("invi.name LIKE '%" + $scope.item_name + "%'");
            }
            condition.push("tro.id = tre.order_id");
            condition.push("tre.item_id = invi.id");
            // Main select query
            sql_query = {
                select: ["tro.id order_id", "tre.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "tro.due_date due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe2.name status_name", "tre.price price", "tre.discount discount", "tre.subtotal subtotal", "tre.expense expense", "tre.total total", "tre.tax tax", "tre.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "tre.item_id item_id", "invi.code item_code", "invi.name item_name", "tre.quantity quantity", "tre.unit_id unit_id", "pe4.name currency_name", "pe5.name unit_name"],
                table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id", $scope.$parent.comp_code + "transaction_entry tre LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe5 ON pe5.id = tre.unit_id", $scope.$parent.comp_code + "inventory_item invi"],
                condition: condition,
                order: ["tro.date", "tro.number", "tre.id"],
                limit: []
            };
            //$http.get("../../php/select.php?params=" + JsonToString(sql_query))
            $http.post("../../php/select.php", JsonToString(sql_query))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[5006] Error occurred while querying the database");
                            return false;
                        }
                        $scope.entries = response;
                        $scope.setTotalAmounts();
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        }
    };

    // Calculate entries total amounts
    $scope.setTotalAmounts = function () {
        $scope.totals = new Object();
        if ($scope.report_id === 500001) { // contacts balances
            $scope.totals_desc = $scope.params["510010"].value;
            for (var i = 0; i < $scope.entries.length; i++) {
                //console.log(i + " balance: " + $scope.entries[i].balance);
                if ($scope.entries[i].currency_name in $scope.totals) {
                    $scope.totals[$scope.entries[i].currency_name].balance += Number($scope.entries[i].balance);
                } else {
                    var total_object = new Object();
                    total_object.balance = Number($scope.entries[i].balance);
                    $scope.totals[$scope.entries[i].currency_name] = total_object;
                }
            }
        }
        if ($scope.report_id === 500002) { // orders
            $scope.totals_desc = $scope.params["520010"].value;
            for (var i = 0; i < $scope.entries.length; i++) {
                if ($scope.entries[i].type_name in $scope.totals) {
                    if ($scope.entries[i].currency_name in $scope.totals[$scope.entries[i].type_name]) {
                        $scope.totals[$scope.entries[i].type_name][$scope.entries[i].currency_name] += Number($scope.entries[i].nettotal);
                    } else {
                        $scope.totals[$scope.entries[i].type_name][$scope.entries[i].currency_name] = Number($scope.entries[i].nettotal);
                    }
                } else {
                    var total_type = new Object();
                    total_type[$scope.entries[i].currency_name] = Number($scope.entries[i].nettotal);
                    $scope.totals[$scope.entries[i].type_name] = total_type;
                }
            }
        } else if ($scope.report_id === 500003) { // accounts balances
            $scope.totals_desc = $scope.params["530010"].value;
            for (var i = 0; i < $scope.entries.length; i++) {
                //console.log(i + " balance: " + $scope.entries[i].balance);
                if ($scope.entries[i].currency_name in $scope.totals) {
                    $scope.totals[$scope.entries[i].currency_name].balance += Number($scope.entries[i].balance);
                } else {
                    var total_object = new Object();
                    total_object.balance = Number($scope.entries[i].balance);
                    $scope.totals[$scope.entries[i].currency_name] = total_object;
                }
            }
        } else if ($scope.report_id === 500004) { // journal
            $scope.totals_desc = $scope.params["540010"].value;
            for (var i = 0; i < $scope.entries.length; i++) {
                if ($scope.entries[i].currency_name in $scope.totals) {
                    $scope.totals[$scope.entries[i].currency_name].debit += Number($scope.entries[i].debit);
                    $scope.totals[$scope.entries[i].currency_name].credit += Number($scope.entries[i].credit);
                } else {
                    var total_object = new Object();
                    total_object.debit = Number($scope.entries[i].debit);
                    total_object.credit = Number($scope.entries[i].credit);
                    $scope.totals[$scope.entries[i].currency_name] = total_object;
                }
            }
        } else if ($scope.report_id === 500005) { // inventory
            $scope.totals_desc = $scope.params["550010"].value;
            for (var i = 0; i < $scope.entries.length; i++) {
                if ($scope.entries[i].currency_name in $scope.totals) {
                    $scope.totals[$scope.entries[i].currency_name].quantity += Number($scope.entries[i].quantity);
                    $scope.totals[$scope.entries[i].currency_name].balance += Number($scope.entries[i].balance);
                } else {
                    var total_object = new Object();
                    total_object.quantity = Number($scope.entries[i].quantity);
                    total_object.balance = Number($scope.entries[i].balance);
                    $scope.totals[$scope.entries[i].currency_name] = total_object;
                }
            }
        } else if ($scope.report_id === 500006) { // movements
            $scope.totals_desc = $scope.params["560010"].value;
            for (var i = 0; i < $scope.entries.length; i++) {
                if ($scope.entries[i].type_name in $scope.totals) {
                    if ($scope.entries[i].currency_name in $scope.totals[$scope.entries[i].type_name]) {
                        $scope.totals[$scope.entries[i].type_name][$scope.entries[i].currency_name].nettotal += Number($scope.entries[i].nettotal);
                        $scope.totals[$scope.entries[i].type_name][$scope.entries[i].currency_name].quantity += Number($scope.entries[i].quantity);
                    } else {
                        var total_type = new Object();
                        total_type[$scope.entries[i].currency_name] = new Object();
                        total_type[$scope.entries[i].currency_name].nettotal = Number($scope.entries[i].nettotal);
                        total_type[$scope.entries[i].currency_name].quantity = Number($scope.entries[i].quantity);
                        $scope.totals[$scope.entries[i].type_name] = total_type;
                    }
                } else {
                    var total_type = new Object();
                    total_type[$scope.entries[i].currency_name] = new Object();
                    total_type[$scope.entries[i].currency_name].nettotal = Number($scope.entries[i].nettotal);
                    total_type[$scope.entries[i].currency_name].quantity = Number($scope.entries[i].quantity);
                    $scope.totals[$scope.entries[i].type_name] = total_type;
                }
            }
        }
    };

    // Display PDF print form
    $scope.printOrder = function (id) {
        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Reports',
            eventLabel: 'Report Print - ' + $scope.params[$scope.report_id.toString()].value
        });

        var params = {
            language: $scope.$parent.lang_code,
            code: $scope.$parent.comp_code,
            form: ["transaction_order"],
            param: ["order_id"],
            value: [id]
        };
        //$http.get("../../php/print_transaction.php?params=" + JsonToString(params), {responseType: 'arraybuffer'})
        $http.post("../../php/print_transaction.php", JsonToString(params), {responseType: 'arraybuffer'})
                .success(function (response) {
                    if (response < 0) {
                        alert("[1111] Error occurred while printing");
                        return false;
                    }
                    var file = new Blob([response], {type: 'application/pdf'});
                    var fileURL = URL.createObjectURL(file);
                    window.open(fileURL);
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    };

    // Display PDF print form
    $scope.printStatement = function (comp_id, curr_id, ledger_id) {
        var params = {};
        if (comp_id > 0) {
            params = {
                language: $scope.$parent.lang_code,
                code: $scope.$parent.comp_code,
                value: [comp_id, "", "", curr_id, 0]
            };
        } else {
            params = {
                language: $scope.$parent.lang_code,
                code: $scope.$parent.comp_code,
                value: [0, "", "", curr_id, ledger_id]
            };
        }

        //$http.get("../../php/print_statement.php?params=" + JsonToString(params), {responseType: 'arraybuffer'})
        $http.post("../../php/print_statement.php", JsonToString(params), {responseType: 'arraybuffer'})
                .success(function (response) {
                    if (response < 0) {
                        alert("[1111] Error occurred while printing");
                        return false;
                    }
                    var file = new Blob([response], {type: 'application/pdf'});
                    var fileURL = URL.createObjectURL(file);
                    window.open(fileURL);
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    };

    // Display PDF print form
    $scope.printItemHistory = function (item_id, curr_id) {           
        var params = {
            language: $scope.$parent.lang_code,
            code: $scope.$parent.comp_code,
            value: [item_id, $filter('date')($scope.trans_date_from, "yyyy-MM-dd"),
                $filter('date')($scope.trans_date_to, "yyyy-MM-dd"), curr_id]  // "2015-01-01", "2015-12-31"]
        };
        //$http.get("../../php/print_history.php?params=" + JsonToString(params), {responseType: 'arraybuffer'})
        $http.post("../../php/print_history.php", JsonToString(params), {responseType: 'arraybuffer'})
                .success(function (response) {
                    if (response < 0) {
                        alert("[1111] Error occurred while printing");
                        return false;
                    }
                    var file = new Blob([response], {type: 'application/pdf'});
                    var fileURL = URL.createObjectURL(file);
                    window.open(fileURL);
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    };

    // Display PDF print report list
    $scope.printList = function () {
        if ($scope.entries.length === 0) {
            return;
        }
        var params = {
            language: $scope.$parent.lang_code,
            code: $scope.$parent.comp_code,
            id: $scope.report_id,
            title: $scope.report_title,
            header: $scope.table_header[$scope.report_id],
            query: sql_query,
            totals: $scope.totals,
            desc: $scope.totals_desc
        };
        //$http.get("../../php/print_list.php?params=" + JsonToString(params), {responseType: 'arraybuffer'})
        $http.post("../../php/print_list.php", JsonToString(params), {responseType: 'arraybuffer'})
                .success(function (response) {
                    if (response < 0) {
                        alert("[1111] Error occurred while printing");
                        return false;
                    }
                    var file = new Blob([response], {type: 'application/pdf'});
                    var fileURL = URL.createObjectURL(file);
                    window.open(fileURL);
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    };

// Display error message
    $scope.showErrorMessage = function (title, message) {
        $scope.msg_title = title;
        $scope.msg_body = message;
        $("#messageModal").modal("show");
    };

});