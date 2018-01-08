'use strict';

quickcountApp.controller('DashboardCtrl', function ($scope, $http, $filter, $location) {

    // Check if currently loading parameters
    if (loading) {
        //console.log("DashboardCtrl - loading: " + loading);
        currentModule = 10;
        $location.path('/empty');
        return;
    }
    
    // Module
    if (currentModule === 10) {
        return;
    }
    currentModule = 10;
    
    // Retrieving user login session variables
    console.log("DashboardCtrl - user logged: " + $scope.$parent.user_logged 
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
        eventAction: 'Menu Button - Dashboard',
        eventLabel: 'Dashboard'
    });

    // Message text variables
    $scope.msg_title = '';
    $scope.msg_body = '';
    $scope.error_code_type = "";
    $scope.error_code_sign = "";
    $scope.error_name_type = "";
    $scope.error_name_sign = "";

    // Parameters
    $scope.params = params_by_id;
    $scope.groups = params_by_group;

    // Default values
    $scope.setDefaultValues = function () {
        // Dates
        var current_date = ($filter('date')(new Date(), "yyyy-MM-dd"));
        var current_year = ($filter('date')(new Date(), "yyyy"));
        var current_month = ($filter('date')(new Date(), "MM"));
        //console.log("current_date: " + current_date);
        //console.log("current_year: " + current_year);
        //console.log("current_month: " + current_month);

        // Years
        $scope.year_list = [];
        for (var y = Number(current_year); y >= 2000; y--) {
            $scope.year_list.push(String(y));
        }
        // Default year
        $scope.selected_year = current_year;

        // Months
        $scope.month_list = [];
        //var obj = {id: "0", name: ""};
        //$scope.month_list.push(obj);
        for (var i = 0; i < 12; i++) {
            if (String(100101 + i) in $scope.params) {
                $scope.month_list.push({id: String(i + 1), name: $scope.params[String(100101 + i)].value});
            }
        }
        // Default month
        $scope.selected_month = String(Number(current_month));

        // Currencies
        if ("403" in $scope.groups) {
            $scope.currency_list = $scope.groups["403"].slice();
            $scope.currency_list.splice(0, 1); // delete the 1st element without leaving holes
        }

        // Default currency
        if ("407003" in $scope.params) {
            $scope.currency_id = $scope.params["407003"].value;
        }

        // Item Categories
        if ("301" in $scope.groups) {
            $scope.category_list = $scope.groups["301"].slice();
            $scope.category_list.splice(0, 1); // delete the 1st element without leaving holes
        }
    };
    // Dashboard info
    $scope.showDashboard = function () {

        // Main entry list
        $scope.totals_01 = new Object();
        $scope.totals_02 = new Object();
        $scope.totals_03 = new Object();
        $scope.totals_04 = new Object();
        $scope.transactions_01 = [];
        $scope.transactions_02 = [];
        $scope.transactions_03 = [];
        $scope.transactions_04 = [];

        // Selected values
        //console.log("");
        //console.log("$scope.selected_year: " + $scope.selected_year);
        //console.log("$scope.selected_month: " + $scope.selected_month);
        //console.log("$scope.currency_id: " + $scope.currency_id);

        // Selected currency
        var currency_id = Number($scope.currency_id);
        if (currency_id <= 0) {
            console.log("***ERROR*** - currency_id: " + currency_id);
            return false;
        }
        var currency_rate = Number($scope.params[$scope.currency_id].value);
        $scope.currency = $scope.params[$scope.currency_id].name;

        // Chart 01: Monthly Receivavle and Payable Accounts
        var select_sql1 = {
            type: "select",
            code: $scope.$parent.comp_code,
            select: ["MONTH(tro.date) month", "tro.ledger_id ledger_id", "tro.currency_id currency_id", "(SUM(tro.debit) - SUM(tro.credit)) nettotal"],
            table: [$scope.$parent.comp_code + "transaction_journal tro"],
            condition: ["YEAR(tro.date) = '" + $scope.selected_year + "'", "tro.ledger_id IN (213001, 213002)"],
            group: ["MONTH(tro.date)", "tro.ledger_id", "tro.currency_id"],
            order: ["MONTH(tro.date)"],
            limit: []
        };

        // Chart 02: Monthly Turnover
        var select_sql2 = {
            type: "select",
            code: $scope.$parent.comp_code,
            select: ["MONTH(tro.date) month", "tro.currency_id currency_id", "SUM(tro.nettotal) nettotal"],
            table: [$scope.$parent.comp_code + "transaction_order tro"],
            condition: ["YEAR(tro.date) = '" + $scope.selected_year + "'", "tro.type_id = 401002"],
            group: ["MONTH(tro.date)", "currency_id"],
            order: ["MONTH(tro.date)"],
            limit: []
        };

        // Chart 03 & 04: Monthly Sales by Category
        var select_sql3 = {
            type: "select",
            code: $scope.$parent.comp_code,
            select: ["MONTH(tro.date) month", "itm.type_id type_id", "tro.currency_id currency_id", "SUM(tre.nettotal - (tre.nettotal * (tro.price - tro.nettotal) / tro.price)) nettotal", "SUM(tre.quantity) quantity"],
            table: [$scope.$parent.comp_code + "transaction_order tro", $scope.$parent.comp_code + "transaction_entry tre", $scope.$parent.comp_code + "inventory_item itm"],
            condition: ["tro.id = tre.order_id", "itm.id = tre.item_id", "YEAR(tro.date) = '" + $scope.selected_year + "'", "tro.type_id = 401002"],
            group: ["MONTH(tro.date)", "tro.currency_id", "itm.type_id"],
            order: ["MONTH(tro.date)"],
            limit: []
        };

        // Select query for table 1 - monthly invoices
        var select_sql4 = {
            type: "select",
            select: ["tro.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "DAY(tro.date) day", "DATE_FORMAT(tro.due_date, '%Y-%m-%d') due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe1.value type_code", "pe2.name status_name", "tro.price price", "tro.discount discount", "tro.subtotal subtotal", "tro.expense expense", "tro.total total", "tro.tax tax", "tro.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "pe4.name currency_name"],
            table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
            condition: ["YEAR(tro.date) = '" + $scope.selected_year + "'", "MONTH(tro.date) = '" + $scope.selected_month + "'", "tro.type_id IN (401002, 401014, 401016)"],
            order: ["tro.date"],
            limit: []
        };

        // Select query for table 2 - daily receipts
        var select_sql5 = {
            type: "select",
            code: $scope.$parent.comp_code,
            select: ["tro.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "DAY(tro.date) day", "DATE_FORMAT(tro.due_date, '%Y-%m-%d') due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe1.value type_code", "pe2.name status_name", "tro.price price", "tro.discount discount", "tro.subtotal subtotal", "tro.expense expense", "tro.total total", "tro.tax tax", "tro.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "pe4.name currency_name"],
            table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
            condition: ["YEAR(tro.date) = '" + $scope.selected_year + "'", "MONTH(tro.date) = '" + $scope.selected_month + "'", "tro.type_id IN (401003, 401016)"],
            order: ["tro.date"],
            limit: []
        };

        // Select query for table 3 - daily purchases
        var select_sql6 = {
            type: "select",
            code: $scope.$parent.comp_code,
            select: ["tro.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "DAY(tro.date) day", "DATE_FORMAT(tro.due_date, '%Y-%m-%d') due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe1.value type_code", "pe2.name status_name", "tro.price price", "tro.discount discount", "tro.subtotal subtotal", "tro.expense expense", "tro.total total", "tro.tax tax", "tro.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "pe4.name currency_name"],
            table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
            condition: ["YEAR(tro.date) = '" + $scope.selected_year + "'", "MONTH(tro.date) = '" + $scope.selected_month + "'", "tro.type_id IN (401006, 401015, 401017)"],
            order: ["tro.date"],
            limit: []
        };

        // Select query for table 4 - daily payments
        var select_sql7 = {
            type: "select",
            code: $scope.$parent.comp_code,
            select: ["tro.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "DAY(tro.date) day", "DATE_FORMAT(tro.due_date, '%Y-%m-%d') due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe1.value type_code", "pe2.name status_name", "tro.price price", "tro.discount discount", "tro.subtotal subtotal", "tro.expense expense", "tro.total total", "tro.tax tax", "tro.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "pe4.name currency_name"],
            table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe4 ON pe4.id = tro.currency_id"],
            condition: ["YEAR(tro.date) = '" + $scope.selected_year + "'", "MONTH(tro.date) = '" + $scope.selected_month + "'", "tro.type_id IN (401007, 401017)"],
            order: ["tro.date"],
            limit: []
        };

        // Object for all select queries
        var queries = new Object();
        queries[String(Object.keys(queries).length)] = select_sql1;
        queries[String(Object.keys(queries).length)] = select_sql2;
        queries[String(Object.keys(queries).length)] = select_sql3;
        queries[String(Object.keys(queries).length)] = select_sql4;
        queries[String(Object.keys(queries).length)] = select_sql5;
        queries[String(Object.keys(queries).length)] = select_sql6;
        queries[String(Object.keys(queries).length)] = select_sql7;

        // Executing combined list of sql queries
        //console.log("saveAllEntries - JsonToString(queries): " + JsonToString(queries));
        $http.post("../../php/queries.php", JsonToString(queries))
                .success(function (response) {
                    if (response < 0) {
                        alert("[1001] Error occurred while selecting entries");
                        return false;
                    }
                    response = StringToJson(response);


                    // Chart 01: Monthly Receivavle and Payable Accounts
                    var response_1 = response[0];
                    if (!angular.isArray(response_1)) {
                        alert("[1001] Error occurred while querying the database");
                        return false;
                    }

                    // Total amounts
                    var total = 0.0;
                    var amount = 0.0;
                    var curr_id = 0.0;
                    var rate = 0.0;
                    var month = 0;
                    var ledger_id = 0;
                    var accounts_payable = [];
                    var accounts_receivable = [];
                    for (var i = 0; i < response_1.length; i++) {
                        // Multi-currency support
                        amount = Number(response_1[i].nettotal);
                        curr_id = Number(response_1[i].currency_id);
                        month = Number(response_1[i].month);
                        ledger_id = Number(response_1[i].ledger_id);
                        //console.log("amount 1: " + amount + "  curr_id: " + curr_id + "  month: " + month);
                        if (curr_id > 0 && currency_id > 0 && curr_id !== currency_id) {
                            rate = Number($scope.params[curr_id].value);
                            //console.log("rate: " + rate + "  currency_rate: " + currency_rate);
                            if (rate !== 0.0 && currency_rate !== 0.0) {
                                amount = amount / rate * currency_rate;
                            }
                        }
                        amount = Number(amount.toFixed(2));
                        total += amount;
                        //console.log("amount 2: " + amount.toFixed(2));
                        //console.log("total_01: " + total.toFixed(2));
                        if (ledger_id === 213001) {
                            accounts_payable[month] = amount * (-1);
                        } else if (ledger_id === 213002) {
                            accounts_receivable[month] = amount;
                        }
                    }

                    // Bar chart rows
                    var chart_rows = [];
                    for (var i = 1; i <= 12; i++) {
                        var obj = {c: []};
                        obj.c.push({v: $scope.params[String(100100 + i)].value.substr(0, 3)}); //, f: $scope.params[String(100100 + i)].value + " " + $scope.selected_year});
                        obj.c.push({v: accounts_receivable[i], f: $filter('number')(accounts_receivable[i]) + " " + $scope.currency});
                        obj.c.push({v: accounts_payable[i], f: $filter('number')(accounts_payable[i]) + " " + $scope.currency});
                        chart_rows.push(obj);
                    }

                    // Chart definition
                    var chart = {};
                    chart.type = "ColumnChart";
                    chart.displayed = false;
                    chart.data = {
                        cols: [
                            {id: "month", label: $scope.params["100123"].value, type: "string"},
                            {id: "receivable", label: $scope.params["100124"].value, type: "number"},
                            {id: "payable", label: $scope.params["100125"].value, type: "number"}
                        ],
                        rows: chart_rows
                    };
                    chart.options = {
                        title: $scope.params["100121"].value,
                        isStacked: "true",
                        fill: 20,
                        displayExactValues: true,
                        vAxis: {
                            title: $scope.params["100122"].value + " " + $scope.currency,
                            gridlines: {
                                count: 10
                            }
                        },
                        hAxis: {
                            title: $scope.params["100123"].value
                        }
                        //, width: "auto"
                        //, height: "auto"
                        //, legend: { position: "none" }
                        , legend: {position: 'top', maxLines: 3}
                        //, bar: {groupWidth: "95%"}
                        //, chartArea: {right: 0}
                        //, chartArea: {width: '80%', height: '60%', top: 40}
                        //, chartArea: {width: '70%'}
                    };
                    $scope.dashboard_chart01_accounts_monthly = chart;


                    // Chart 02: Monthly Turnover
                    var response_2 = response[1];
                    if (!angular.isArray(response_2)) {
                        alert("[1001] Error occurred while querying the database");
                        return false;
                    }

                    // Total amounts
                    var total = 0.0;
                    var amount = 0.0;
                    var curr_id = 0.0;
                    var rate = 0.0;
                    var turnover = [];
                    var month = 0;
                    for (var i = 0; i < response_2.length; i++) {
                        // Multi-currency support
                        amount = Number(response_2[i].nettotal);
                        curr_id = Number(response_2[i].currency_id);
                        month = Number(response_2[i].month);
                        //console.log("amount 1: " + amount + "  curr_id: " + curr_id + "  month: " + month);
                        if (curr_id > 0 && currency_id > 0 && curr_id !== currency_id) {
                            rate = Number($scope.params[curr_id].value);
                            if (rate !== 0.0 && currency_rate !== 0.0) {
                                amount = amount / rate * currency_rate;
                            }
                        }
                        amount = Number(amount.toFixed(2));
                        total += amount;
                        //console.log("amount 2: " + amount.toFixed(2));
                        //console.log("total_01: " + total.toFixed(2));
                        turnover[month] = amount;
                    }

                    // Bar chart rows
                    var chart_rows = [];
                    for (var i = 1; i <= 12; i++) {
                        var obj = {c: []};
                        obj.c.push({v: $scope.params[String(100100 + i)].value.substr(0, 3)}); //, f: $scope.params[String(100100 + i)].value + " " + $scope.selected_year});
                        obj.c.push({v: turnover[i], f: $filter('number')(turnover[i]) + " " + $scope.currency});
                        chart_rows.push(obj);
                    }

                    // Chart definition
                    var chart = {};
                    chart.type = "ColumnChart";
                    chart.displayed = false;
                    chart.data = {
                        cols: [
                            {id: "month", label: $scope.params["100133"].value, type: "string"},
                            {id: "turnover", label: "", type: "number"}
                        ],
                        rows: chart_rows
                    };
                    chart.options = {
                        title: $scope.params["100131"].value,
                        isStacked: "true",
                        fill: 20,
                        displayExactValues: true,
                        vAxis: {
                            title: $scope.params["100132"].value + " " + $scope.currency,
                            gridlines: {
                                count: 10
                            }
                        },
                        hAxis: {
                            title: $scope.params["100133"].value
                        }
                        //, width:  600
                        //, height: 240
                        , legend: {position: "none", textStyle: {fontSize: 8}}
                        //, legend: {position: 'top', maxLines: 3}
                        //, bar: {groupWidth: "95%"}
                        //, chartArea: {right: 0}
                        //, chartArea: {width: '80%', height: '70%', top: 20}
                        //, chartArea: {width: '70%'}
                    };
                    $scope.dashboard_chart02_turnover_monthly = chart;


                    // Chart 03 & 04: Monthly Sales by Category
                    var response_3 = response[2];
                    if (!angular.isArray(response_3)) {
                        alert("[1001] Error occurred while querying the database");
                        return false;
                    }

                    // Total amounts
                    var total = 0.0;
                    var amount = 0.0;
                    var curr_id = 0;
                    var type_id = 0;
                    var rate = 0.0;
                    var month = 0;
                    var quantity = 0;
                    var total_month = {};
                    var quantity_month = {};
                    var total_year = {};
                    var quantity_year = {};
                    for (var i = 1; i <= 12; i++) {
                        total_month[i] = {};
                        quantity_month[i] = {};
                    }
                    for (var i = 0; i < response_3.length; i++) {
                        amount = Number(response_3[i].nettotal);
                        curr_id = Number(response_3[i].currency_id);
                        month = Number(response_3[i].month);
                        type_id = Number(response_3[i].type_id);
                        quantity = Number(response_3[i].quantity);
                        // Multi-currency support
                        //console.log("amount 1: " + amount + "  curr_id: " + curr_id + "  month: " + month);
                        if (curr_id > 0 && currency_id > 0 && curr_id !== currency_id) {
                            rate = Number($scope.params[curr_id].value);
                            if (rate !== 0.0 && currency_rate !== 0.0) {
                                amount = amount / rate * currency_rate;
                            }
                        }
                        amount = Number(amount.toFixed(2));
                        total += amount;
                        //console.log("amount 2: " + amount.toFixed(2));
                        //console.log("total_01: " + total.toFixed(2));
                        //console.log("String(type_id)]: " + String(type_id));
                        total_month[month][String(type_id)] = amount;
                        quantity_month[month][String(type_id)] = quantity;
                        //console.log("total_month[month][String(type_id)]: " + total_month[month][String(type_id)]);
                        //console.log("quantity_month[month][String(type_id)]: " + quantity_month[month][String(type_id)]);
                        if (total_year[String(type_id)]) {
                            total_year[String(type_id)] += amount;
                            quantity_year[String(type_id)] += quantity;
                        } else {
                            total_year[String(type_id)] = amount;
                            quantity_year[String(type_id)] = quantity;
                        }
                        //console.log("total_year[String(type_id)]: " + total_year[String(type_id)]);                      
                    }

                    // Chart values
                    // Columns
                    var chart_cols = [];
                    chart_cols.push({id: "month", label: $scope.params["100143"].value, type: "string"});
                    for (var j = 0; j < $scope.category_list.length; j++) {
                        chart_cols.push({id: $scope.category_list[j].id, label: $scope.category_list[j].name, type: "number"});
                    }
                    // Bar chart rows
                    var chart_rows = [];
                    for (var i = 1; i <= 12; i++) {
                        var obj = {c: []};
                        obj.c.push({v: $scope.params[String(100100 + i)].value.substr(0, 3)}); //, f: $scope.params[String(100100 + i)].value + " " + $scope.selected_year});
                        for (var j = 0; j < $scope.category_list.length; j++) {
                            if (total_month[i][$scope.category_list[j].id]) {
                                obj.c.push({v: total_month[i][$scope.category_list[j].id], f: $filter('number')(total_month[i][$scope.category_list[j].id]) + " " + $scope.currency + " (qty: " + quantity_month[i][$scope.category_list[j].id] + ")"});
                            } else {
                                obj.c.push({v: 0});
                            }
                        }
                        chart_rows.push(obj);
                    }
                    // Pie chart rows
                    var pie_chart_rows = [];
                    for (var property in total_year) {
                        if (total_year.hasOwnProperty(property)) {
                            var obj = {c: []};
                            if ($scope.params.hasOwnProperty(property)) {
                                obj.c.push({v: $scope.params[property].name});
                            }
                            obj.c.push({v: total_year[property], f: $filter('number')(total_year[property]) + " " + $scope.currency + " (qty: " + quantity_year[property] + ")"});
                            pie_chart_rows.push(obj);
                        }
                    }

                    // Chart 03: Yearly Sales by Category
                    var chart = {};
                    chart.type = "PieChart";
                    chart.displayed = false;
                    chart.data = {
                        cols: chart_cols,
                        rows: pie_chart_rows
                    };
                    chart.options = {
                        title: $scope.params["100141"].value,
                        isStacked: "true",
                        fill: 20,
                        displayExactValues: true,
                        vAxis: {
                            title: $scope.params["100142"].value,
                            gridlines: {
                                count: 10
                            }
                        },
                        hAxis: {
                            title: $scope.params["100143"].value
                        }
                        //, width:  600
                        //, height: 240
                        //, legend: { position: "none" }
                        //, legend: {position: 'top', maxLines: 3}
                        //, bar: {groupWidth: "95%"}
                        //, chartArea: {width: '100%'}
                    };
                    $scope.dashboard_chart03_sales_yearly = chart;

                    // Chart definition
                    var chart = {};
                    chart.type = "ColumnChart";
                    chart.displayed = false;
                    chart.data = {
                        cols: chart_cols,
                        rows: chart_rows
                    };
                    chart.options = {
                        title: $scope.params["100151"].value,
                        isStacked: "true",
                        fill: 20,
                        displayExactValues: true,
                        vAxis: {
                            title: $scope.params["100152"].value + " " + $scope.currency,
                            gridlines: {
                                count: 10
                            }
                        },
                        hAxis: {
                            title: $scope.params["100153"].value
                        }
                        //, width:  600
                        //, height: 240
                        //, legend: { position: "none" }
                        , legend: {position: 'top', maxLines: 2}
                        //, bar: {groupWidth: "95%"}
                        , chartArea: {width: '70%'}
                    };
                    $scope.dashboard_chart04_sales_monthly = chart;


                    // Select query for table 1 - monthly invoices
                    var response_4 = response[3];
                    if (!angular.isArray(response_4)) {
                        alert("[1001] Error occurred while querying the database");
                        return false;
                    }
                    $scope.transactions_01 = response_4;
                    // Total amounts
                    for (var i = 0; i < $scope.transactions_01.length; i++) {
                        var amount = Number($scope.transactions_01[i].nettotal);
                        if ($scope.transactions_01[i].type_id === "401014") {
                            $scope.transactions_01[i].nettotal = -$scope.transactions_01[i].nettotal;
                            amount *= (-1);
                        }
                        if ($scope.transactions_01[i].currency_name in $scope.totals_01) {
                            $scope.totals_01[$scope.transactions_01[i].currency_name].nettotal += amount;
                        } else {
                            var total_object = new Object();
                            total_object.nettotal = amount;
                            $scope.totals_01[$scope.transactions_01[i].currency_name] = total_object;
                        }
                    }


                    // Select query for table 2 - daily receipts
                    var response_5 = response[4];
                    if (!angular.isArray(response_5)) {
                        alert("[1002] Error occurred while querying the database");
                        return false;
                    }
                    $scope.transactions_02 = response_5;
                    // Total amounts
                    for (var i = 0; i < $scope.transactions_02.length; i++) {
                        var amount = Number($scope.transactions_02[i].nettotal);
                        if ($scope.transactions_02[i].currency_name in $scope.totals_02) {
                            $scope.totals_02[$scope.transactions_02[i].currency_name].nettotal += amount;
                        } else {
                            var total_object = new Object();
                            total_object.nettotal = amount;
                            $scope.totals_02[$scope.transactions_02[i].currency_name] = total_object;
                        }
                    }


                    // Select query for table 3 - daily purchases
                    var response_6 = response[5];
                    if (!angular.isArray(response_6)) {
                        alert("[1003] Error occurred while querying the database");
                        return false;
                    }
                    $scope.transactions_03 = response_6;
                    // Total amounts
                    for (var i = 0; i < $scope.transactions_03.length; i++) {
                        var amount = Number($scope.transactions_03[i].nettotal);
                        if ($scope.transactions_03[i].type_id === "401015") {
                            $scope.transactions_03[i].nettotal = -$scope.transactions_03[i].nettotal;
                            amount *= (-1);
                        }
                        if ($scope.transactions_03[i].currency_name in $scope.totals_03) {
                            $scope.totals_03[$scope.transactions_03[i].currency_name].nettotal += amount;
                        } else {
                            var total_object = new Object();
                            total_object.nettotal = amount;
                            $scope.totals_03[$scope.transactions_03[i].currency_name] = total_object;
                        }
                    }


                    // Select query for table 4 - daily payments
                    var response_7 = response[6];
                    if (!angular.isArray(response_7)) {
                        alert("[1004] Error occurred while querying the database");
                        return false;
                    }
                    $scope.transactions_04 = response_7;
                    // Total amounts
                    for (var i = 0; i < $scope.transactions_04.length; i++) {
                        var amount = Number($scope.transactions_04[i].nettotal);
                        if ($scope.transactions_04[i].currency_name in $scope.totals_04) {
                            $scope.totals_04[$scope.transactions_04[i].currency_name].nettotal += amount;
                        } else {
                            var total_object = new Object();
                            total_object.nettotal = amount;
                            $scope.totals_04[$scope.transactions_04[i].currency_name] = total_object;
                        }
                    }
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

    // Displaying the dashboard
    $scope.setDefaultValues();
    $scope.showDashboard();
    
});
