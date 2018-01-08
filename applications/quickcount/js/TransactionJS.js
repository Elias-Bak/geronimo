'use strict';

quickcountApp.controller('TransactionCtrl', function ($scope, $http, $filter, $location, $cookies) {

    // Check if currently loading parameters
    if (loading) {
        //console.log("TransactionCtrl - loading: " + loading);
        currentModule = 40;
        $location.path('/empty');
        return;
    }

    // Module
    if (currentModule === 40) {
        return;
    }
    currentModule = 40;

    // Retrieving user login session variables
    console.log("TransactionCtrl - user logged: " + $scope.$parent.user_logged
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
        eventAction: 'Menu Button - Operations',
        eventLabel: 'Operations List'
    });

    // Main entry list
    $scope.transactions = [];
    $scope.companies = [];
    $scope.items = [];
    $scope.trans_index = new Object();
    $scope.comp_index = new Object();
    $scope.item_index = new Object();
    $scope.trans_offset = 0;

    // Form data variables
    $scope.id = '0';
    $scope.date = '';
    $scope.due_date = '';
    $scope.code = '';
    $scope.number = '';
    $scope.type_id = '0';
    $scope.tax_id = '0';
    $scope.company_id = '0';
    $scope.status_id = '0';
    $scope.currency_id = '0';
    $scope.company_name = '';
    $scope.note = '';

    // Form table entries
    $scope.item_list = [];
    $scope.trans_entries = [];
    $scope.quantity = 0;
    $scope.price = 0;
    $scope.discount = 0;
    $scope.discount_input = '%';
    $scope.subtotal = 0;
    $scope.expense = 0;
    $scope.total = 0;
    $scope.tax = 0;
    $scope.tax_input = 0;
    $scope.nettotal = 0;
    $scope.balance = 0;
    $scope.account_balance = 0;

    // Control flag variables
    $scope.create = false;
    $scope.edit = false;
    $scope.error = false;
    $scope.incomplete = false;
    $scope.show_ops_list = true;
    $scope.show_type_list = false;
    $scope.show_company_list = false;
    $scope.show_item_list = false;

    // Message text variables
    $scope.msg_title = '';
    $scope.msg_body = '';
    $scope.error_code_type = "";
    $scope.error_code_sign = "";
    $scope.error_name_type = "";
    $scope.error_name_sign = "";

    // Table grid pagination variables
    $scope.trans_search = "";
    $scope.trans_itemsPerPage = 10;
    $scope.trans_currentPage = 0;
    $scope.trans_pageCount = 0;
    $scope.trans_prevPage = function () {
        if ($scope.trans_currentPage > 0) {
            $scope.trans_currentPage--;
        }
    };
    $scope.trans_nextPage = function () {
        if ($scope.trans_currentPage < $scope.trans_pageCount) {
            $scope.trans_currentPage++;
        }
    };
    $scope.trans_prevPageDisabled = function () {
        return $scope.trans_currentPage === 0 ? "disabled" : "";
    };
    $scope.trans_nextPageDisabled = function () {
        return $scope.trans_currentPage === $scope.trans_pageCount ? "disabled" : "";
    };
    $scope.trans_setPage = function (pageNo) {
        $scope.trans_currentPage = pageNo;
    };
    $scope.$watch('trans_search', function () {
        var filtered = $filter('filter')($scope.transactions, $scope.trans_search);
        $scope.trans_pageCount = Math.ceil(filtered.length / $scope.trans_itemsPerPage) - 1;
        if ($scope.trans_pageCount < 0) {
            $scope.trans_pageCount = 0;
        }
    });

    // Table grid pagination variables for companies list
    $scope.comp_search = "";
    $scope.comp_itemsPerPage = 10;
    $scope.comp_currentPage = 0;
    $scope.comp_pageCount = 0;
    $scope.comp_prevPage = function () {
        if ($scope.comp_currentPage > 0) {
            $scope.comp_currentPage--;
        }
    };
    $scope.comp_nextPage = function () {
        if ($scope.comp_currentPage < $scope.comp_pageCount) {
            $scope.comp_currentPage++;
        }
    };
    $scope.comp_prevPageDisabled = function () {
        return $scope.comp_currentPage === 0 ? "disabled" : "";
    };
    $scope.comp_nextPageDisabled = function () {
        return $scope.comp_currentPage === $scope.comp_pageCount ? "disabled" : "";
    };
    $scope.comp_setPage = function (pageNo) {
        $scope.comp_currentPage = pageNo;
    };
    $scope.$watch('comp_search', function () {
        var filtered = $filter('filter')($scope.companies, $scope.comp_search);
        $scope.comp_pageCount = Math.ceil(filtered.length / $scope.comp_itemsPerPage) - 1;
        if ($scope.comp_pageCount < 0) {
            $scope.comp_pageCount = 0;
        }
    });

    // Table grid pagination variables for items list
    $scope.item_search = "";
    $scope.item_itemsPerPage = 10;
    $scope.item_currentPage = 0;
    $scope.item_pageCount = 0; //$scope.$parent.item_pageCount;
    $scope.item_prevPage = function () {
        if ($scope.item_currentPage > 0) {
            $scope.item_currentPage--;
        }
    };
    $scope.item_nextPage = function () {
        if ($scope.item_currentPage < $scope.item_pageCount) {
            $scope.item_currentPage++;
        }
    };
    $scope.item_prevPageDisabled = function () {
        return $scope.item_currentPage === 0 ? "disabled" : "";
    };
    $scope.item_nextPageDisabled = function () {
        return $scope.item_currentPage === $scope.item_pageCount ? "disabled" : "";
    };
    $scope.item_setPage = function (pageNo) {
        $scope.item_currentPage = pageNo;
    };
    $scope.$watch('item_search', function () {
        var filtered = $filter('filter')($scope.items, $scope.item_search);
        $scope.item_pageCount = Math.ceil(filtered.length / $scope.item_itemsPerPage) - 1;
        if ($scope.item_pageCount < 0) {
            $scope.item_pageCount = 0;
        }
    });

    // Input data validation
    $scope.$watch('number', function () {
        //$scope.test();
    });
    $scope.$watch('company', function () {
        $scope.test();
    });
    $scope.test = function () {
        $scope.error = false;
        $scope.incomplete = false;
        $scope.error_number_type = "";
        $scope.error_number_sign = "";
        $scope.error_company_type = "";
        $scope.error_company_sign = "";
//        if ($scope.edit) {
//            if (!$scope.number.length) {
//                $scope.incomplete = true;
//                $scope.error_number_type = "has-warning";
//                $scope.error_number_sign = "glyphicon-warning-sign";
//            } else {
//                //$scope.error_number_type = "has-success";
//                //$scope.error_number_sign = "glyphicon-ok";
//            }
//            if ($scope.company_id <= 0) {
//                $scope.incomplete = true;
//                $scope.error_company_type = "has-warning";
//                $scope.error_company_sign = "glyphicon-warning-sign";
//            } else {
//                //$scope.error_company_type = "has-success";
//                //$scope.error_company_sign = "glyphicon-ok";
//            }
//        }
    };

    // Processing transaction response data from server
    $scope.processTransaction = function (response) {
        if (!angular.isArray(response)) {
            alert("[1106] Error occurred while querying the database");
            return false;
        }
        $scope.transactions = response;
        for (var i = 0; i < response.length; i++) {
            $scope.trans_index[response[i].id] = i;
        }
        $scope.trans_pageCount = Math.ceil($scope.transactions.length / $scope.trans_itemsPerPage) - 1;
        if ($scope.trans_pageCount < 0) {
            $scope.trans_pageCount = 0;
        }
    };

    // Getting cached data if available
    if (typeof (window.transaction_order) !== "undefined") {
        $scope.processTransaction(window.transaction_order, false);
    } else {
        // Main select query
        var select_sql = {
            select: ["tro.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "tro.due_date due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe2.name status_name", "tro.price price", "tro.discount discount", "tro.subtotal subtotal", "tro.expense expense", "tro.total total", "tro.tax tax", "tro.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "tro.discount_input discount_input", "tro.tax_id tax_id", "tro.tax_input tax_percent"],
            table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id"],
            condition: [],
            order: ["tro.date desc, tro.number desc, tro.id desc"],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    // Converting response to JSON format
                    window.transaction_order = StringToJson(response);
                    // Processing retrieved data
                    $scope.processTransaction(window.transaction_order, true);
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    }

    // Show type list
    $scope.showTypeList = function () {
        //console.log("in showTypeList");
        $scope.edit = false;
        $scope.show_ops_list = false;
        $scope.show_type_list = true;
        $scope.show_company_list = false;
        $scope.show_item_list = false;
    };

    // Set type ID
    $scope.selectTypeId = function (id) {
        //console.log("setTypeId: " + id);
        if (id > 0) {
            $scope.type_id = id;
            $scope.code = String($scope.params[id].value);
            $scope.showCompanyList();
        }
    };

    // Processing account response data from server
    $scope.processAccount = function (response) {
        if (!angular.isArray(response)) {
            alert("[1106] Error occurred while querying the database");
            return false;
        }
        $scope.companies = response;
        for (var i = 0; i < response.length; i++) {
            $scope.comp_index[response[i].id] = i;
        }
        $scope.comp_pageCount = Math.ceil($scope.companies.length / $scope.comp_itemsPerPage) - 1;
        if ($scope.comp_pageCount < 0) {
            $scope.comp_pageCount = 0;
        }
    };

    // Show type list
    $scope.showCompanyList = function () {
        //console.log("in showCompanyList");
        $scope.comp_search = $scope.company_name;
        $scope.edit = false;
        $scope.show_ops_list = false;
        $scope.show_type_list = false;
        $scope.show_company_list = true;
        $scope.show_item_list = false;
        if ($scope.companies.length === 0) {
            // Getting cached data if available
            if (typeof (window.account) !== "undefined") {
                $scope.processAccount(window.account, false);
            } else {
                var select_sql_c = {
                    select: ["cp.id id", "cp.type_id type_id", "cp.code code", "cp.name name", "cp.note note", "pe.name type_name", "ct.name contact", "co.name mobile", "cp.terms_id terms_id"],
                    table: [$scope.$parent.comp_code + "account_company cp LEFT JOIN " + $scope.$parent.comp_code + "account_contact ct ON ct.company_id = cp.id LEFT JOIN " + $scope.$parent.comp_code + "account_coordinate co ON co.company_id = cp.id AND co.type_id = 208002 LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe ON pe.id = cp.type_id"],
                    condition: [],
                    order: ["cp.name"],
                    limit: []
                };
                $http.post("../../php/select.php", JsonToString(select_sql_c))
                        .success(function (response) {
                            // Converting response to JSON format
                            window.account = StringToJson(response);
                            // Processing retrieved data
                            $scope.processAccount(window.account, true);
                        })
                        .error(function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        });
            }
        }
    };

    // Set company ID
    $scope.setCompanyId = function (id, name, terms_id) {
        //console.log("setCompanyId - id: " + id + "  name: " + name + "  terms_id: " + terms_id);
        $scope.company_id = id;
        $scope.company_name = name;
        if ($scope.company_id > 0) {
            if (terms_id > 0) {
                //console.log("setCompanyId - terms_id: " + terms_id + "  value: " + $scope.params[terms_id].value);
                $scope.due_date = new Date();
                var daysToAdd = Number($scope.params[terms_id].value);
                $scope.due_date.setDate($scope.due_date.getDate() + daysToAdd);
            }
            $scope.showTransaction();
            $scope.getAccountBalance();
        }
    };

    // Getting the account balance
    $scope.getAccountBalance = function () {

        // Setting default account balance value
        $scope.balance = 0;
        $scope.account_balance = 0;

        // Getting the balance if company is selected
        if ($scope.company_id > 0) {

            // Filtering conditions
            var condition = [];
            condition.push("tro.company_id = " + $scope.company_id);
            condition.push("tro.currency_id = " + $scope.currency_id);
            condition.push("tro.date <= '" + $filter('date')($scope.date, "yyyy-MM-dd") + "'");
            if ($scope.id > 0) {
                condition.push("tro.order_id != " + $scope.id);
            }


            // Main select query
            var sql_query = {
                select: ["tro.company_id company_id", "tro.currency_id currency_id", "(sum(tro.debit) - sum(tro.credit)) balance"],
                table: [$scope.$parent.comp_code + "transaction_journal tro"],
                condition: condition,
                order: [],
                limit: []
            };
            $http.post("../../php/select.php", JsonToString(sql_query))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[1115] Error occurred while querying the database");
                            return false;
                        }
                        if (response && response.length > 0) {
                            if (response[0].balance) {
                                $scope.account_balance = Number(response[0].balance);
                            }
                        }
                        $scope.setAccountBalance();
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        }
    };

    // Calculating the new temporary balance
    $scope.setAccountBalance = function () {
        switch ($scope.type_id) {
            case "401002": // Sales Invoice
            case "401016": // Cash Sales Invoice
            case "401015": // Purchase Return
            case "401007": // Payment Voucher
            case "401008": // Debit Note
            case "401011": // Bank Deposit
            case "401012": // Cash Deposit
            case "401013": // Expenses
                $scope.balance = $scope.account_balance + $scope.nettotal;
                break;
            case "401014": // Invoice Return                
            case "401003": // Receipt Voucher
            case "401004": // Credit Note
            case "401006": // Purchase Invoice
            case "401017": // Cash Purchase Invoice
                $scope.balance = $scope.account_balance - $scope.nettotal;
                break;
        }
    }

    // Processing inventory response data from server
    $scope.processInventory = function (response) {
        if (!angular.isArray(response)) {
            alert("[1106] Error occurred while querying the database");
            return false;
        }
        $scope.items = response;
        for (var i = 0; i < response.length; i++) {
            $scope.item_index[response[i].id] = i;
        }
        $scope.item_pageCount = Math.ceil($scope.items.length / $scope.item_itemsPerPage) - 1;
        if ($scope.item_pageCount < 0) {
            $scope.item_pageCount = 0;
        }
    };

    // Select items
    $scope.showItemList = function () {
        //console.log("in showItemList");
        //console.log("form type id: " + $scope.params[$scope.type_id].name + "   " + $scope.params[$scope.type_id].type_id);

        // Voucher case
        if ($scope.params[$scope.type_id].type_id === '409002') {
            var new_trans_entry = {payment_id: "408003", code: "", date: new Date(), currency_id: $scope.currency_id, quantity: "1", price: "0", amount: "0", item_id: "0", tax_id: "0", unit_id: "0"};
            $scope.trans_entries.push(new_trans_entry);
            $scope.setAllAmounts();
            return;
        }

        $scope.edit = false;
        $scope.show_ops_list = false;
        $scope.show_type_list = false;
        $scope.show_company_list = false;
        $scope.show_item_list = true;
        if ($scope.items.length === 0) {

            // Getting cached data if available
            if (typeof (window.inventory) !== "undefined") {
                $scope.processInventory(window.inventory, false);
            } else {
                var select_sql_i = {
                    select: ["it.id id", "it.type_id type_id", "it.code code", "it.name name", "it.note note", "pe.name type_name", "ia.tax_id tax_id", "ia.unit_id unit_id", "ia.currency_id currency_id", "ia.amount amount"],
                    table: [$scope.$parent.comp_code + "inventory_item it LEFT JOIN " + $scope.$parent.comp_code + "inventory_amount ia ON ia.item_id = it.id AND ia.type_id = 305002 LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe ON pe.id = it.type_id"],
                    condition: [],
                    order: ["it.code"],
                    limit: []
                };
                $http.post("../../php/select.php", JsonToString(select_sql_i))
                        .success(function (response) {
                            // Converting response to JSON format
                            window.inventory = StringToJson(response);
                            // Processing retrieved data
                            $scope.processInventory(window.inventory, true);
                        })
                        .error(function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        });
            }
        }
    };

    // Add item
    $scope.addItemId = function (id, code, name, amount, unit_id, tax_id, currency_id, payment_id, index) {
        //console.log("addItemId: " + id + " " + code + " " + name + " " + amount + " " + unit_id + " " + tax_id);
        $scope.item_list.push(id);
        var new_trans_entry = {item_id: id, code: code, description: name, quantity: "1", price: Number(amount).toFixed(2), discount_input: "0", amount: "", unit_id: unit_id, tax_id: tax_id, currency_id: currency_id, payment_id: "0", date: new Date()};
        $scope.trans_entries.push(new_trans_entry);
        $scope.showTransaction();
        $scope.setAllAmounts();
    };

    // Check for selected button ID
    $scope.checkBtnClsId = function (id, tgt_id) {
        if (id === tgt_id) {
            return "btn btn-success";
        } else {
            return "btn btn-default";
        }
    };

    // Check for selected button ID
    $scope.checkBtnClsIds = function (id, tgt_ids) {
        //console.log("in checkBtnClsIds");
        if (angular.isArray(tgt_ids)) {
            //console.log("in checkBtnClsIds - tgt_ids.length: " + tgt_ids.length);
            for (var i = 0; i < tgt_ids.length; i++) {
                //console.log(i + " " + id + " " + tgt_ids[i]);
                if (id === tgt_ids[i]) {
                    return "btn btn-success";
                }
            }
        }
        return "btn btn-default";
    };

    // Set transation entries
    $scope.showTransaction = function () {
        //console.log("in showTransaction");
        $scope.edit = true;
        $scope.show_ops_list = false;
        $scope.show_type_list = false;
        $scope.show_company_list = false;
        $scope.show_item_list = false;
    };

    // New entry
    $scope.newEntry = function () {
        //console.log("in newEntry");
        $scope.create = true;
        $scope.edit = false;
        $scope.incomplete = true;
        $scope.duplicate = false;
        $scope.show_ops_list = false;
        $scope.show_type_list = true;
        $scope.show_company_list = false;
        $scope.show_item_list = false;
        $scope.row_index = -1;
        $scope.item_list = [];
        $scope.trans_entries = [];
        $scope.id = '0';
        $scope.date = new Date();
        $scope.due_date = new Date();
        $scope.code = '';
        $scope.number = '';
        $scope.type_id = '0';
        $scope.company_id = '0';
        $scope.status_id = '0';
        $scope.currency_id = $scope.params['407003'].value;
        $scope.tax_id = $scope.params['407006'].value;
        $scope.company_name = '';
        $scope.note = '';
        $scope.quantity = 0;
        $scope.price = 0;
        $scope.discount = 0;
        $scope.discount_input = '%';
        $scope.subtotal = 0;
        $scope.expense = 0;
        $scope.total = 0;
        $scope.tax = 0;
        $scope.tax_input = 0;
        $scope.nettotal = 0;
        $scope.balance = 0;
        $scope.account_balance = 0;

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Operations',
            eventLabel: 'Operation New'
        });
    };

    // Edit existing entry
    $scope.editEntry = function (index) {
        //console.log("in editEntry");
        $scope.create = false;
        $scope.edit = true;
        $scope.incomplete = false;
        $scope.duplicate = false;
        $scope.row_index = index;
        $scope.id = $scope.transactions[index].id;
        $scope.date = new Date($filter('date')($scope.transactions[index].date, "yyyy-MM-dd"));
        $scope.due_date = new Date($filter('date')($scope.transactions[index].due_date, "yyyy-MM-dd"));
        $scope.number = $scope.transactions[index].number;
        $scope.type_id = $scope.transactions[index].type_id;
        $scope.code = String($scope.params[$scope.type_id].value);
        $scope.company_id = $scope.transactions[index].company_id;
        $scope.status_id = $scope.transactions[index].status_id;
        $scope.currency_id = $scope.transactions[index].currency_id;
        $scope.tax_id = $scope.transactions[index].tax_id;
        $scope.company_name = $scope.transactions[index].company_name;
        $scope.note = $scope.transactions[index].note;
        $scope.price = $scope.transactions[index].price;
        $scope.discount_input = $scope.transactions[index].discount_input;
        $scope.discount = $scope.transactions[index].discount;
        $scope.subtotal = $scope.transactions[index].subtotal;
        $scope.expense = $scope.transactions[index].expense;
        $scope.total = $scope.transactions[index].total;
        $scope.tax = $scope.transactions[index].tax;
        $scope.tax_input = $scope.transactions[index].tax_input;
        $scope.nettotal = $scope.transactions[index].nettotal;
        $scope.item_list = [];
        $scope.trans_entries = [];

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Operations',
            eventLabel: 'Operation Edit [' + $scope.params[$scope.type_id].value + " " + $scope.number + " - " + $scope.company_name + ']'
        });

        // Checking for dates values
        if (!($scope.date)
                || String($scope.date).length === 0
                || String($scope.date) === 'Invalid Date') {
            $scope.date = new Date();
        }
        if (!($scope.due_date)
                || String($scope.due_date).length === 0
                || String($scope.due_date) === 'Invalid Date') {
            $scope.due_date = new Date();
        }

        // Default errors
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";

        // Entries
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "transaction_entry te"],
            condition: ["te.order_id = " + $scope.id],
            order: [],
            limit: []
        };
        //$http.get("../../php/select.php?params=" + JsonToString(select_sql))
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1107] Error occurred while querying the database");
                        return false;
                    }
                    if (response.length > 0) {
                        // Filling entries table
                        for (var i = 0; i < response.length; i++) {
                            $scope.item_list.push(response[i].item_id);
                            var new_trans_entry = {item_id: response[i].item_id, code: response[i].code, description: response[i].description, quantity: Number(response[i].quantity).toFixed(2), price: Number(response[i].price).toFixed(2), discount: Number(response[i].discount).toFixed(2), expense: Number(response[i].expense).toFixed(2), total: Number(response[i].total).toFixed(2), subtotal: Number(response[i].subtotal).toFixed(2), nettotal: Number(response[i].nettotal).toFixed(2), discount_input: response[i].discount_input, amount: Number(response[i].nettotal).toFixed(2), unit_id: response[i].unit_id, tax_id: response[i].tax_id, payment_id: response[i].payment_id, currency_id: response[i].currency_id, date: new Date($filter('date')(response[i].date, "yyyy-MM-dd"))};
                            if (!(response[i].date) || response[i].date.length === 0
                                    || response[i].date.startsWith('0000-00-00')) {
                                new_trans_entry.date = new Date();
                            }
                            $scope.trans_entries.push(new_trans_entry);
                        }
                        // Getting the account balance
                        $scope.getAccountBalance();
                        // Recalculating amounts
                        $scope.setAllAmounts();
                    }
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    };

    // Save new or existing entry
    $scope.saveEntry = function () {
        // Checking for duplicates
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";

        // Save transaction info
        saveTransaction();

        // Display main transaction list
        $scope.returnToList();
    };

    // Transaction info
    function saveTransaction() {
        //console.log("date 01: " + $scope.date);
        //console.log("date 02: " + $filter('date')($scope.date, "yyyy-MM-dd"));

        // Inserting new entry
        if ($scope.id === '0') {
            $scope.edit = false;
            $scope.incomplete = true;

            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Operations',
                eventLabel: 'Operation Insert [' + $scope.params[$scope.type_id].value + " " + $scope.number + " - " + $scope.company_name + ']'
            });

            // New Number
            var select_sql = {
                select: ["MAX(CAST(number AS unsigned integer)) number"],
                table: [$scope.$parent.comp_code + "transaction_order"],
                condition: [],
                order: [],
                limit: []
            };
            //$http.get("../../php/select.php?params=" + JsonToString(select_sql))
            $http.post("../../php/select.php", JsonToString(select_sql))
                    .success(function (response) {
                        response = StringToJson(response);
                        if (!angular.isArray(response)) {
                            alert("[1100] Error occurred while querying the database");
                            return false;
                        }
                        // Number
                        if (response.length > 0) {
                            $scope.number = String(Number(response[0].number) + 1);
                        } else {
                            $scope.number = "1";
                        }

                        //var new_number = "(SELECT MAX(CAST(number AS unsigned integer)) number FROM " + $scope.$parent.comp_code + "transaction_order)";

                        // Order
                        var insert_sql = {
                            table: [$scope.$parent.comp_code + "transaction_order"],
                            field: ["date", "due_date", "number", "type_id", "company_id", "status_id", "currency_id", "tax_id", "note", "price", "discount", "subtotal", "expense", "total", "tax", "nettotal", "discount_input", "tax_input"],
                            value: [$filter('date')($scope.date, "yyyy-MM-dd"), $filter('date')($scope.due_date, "yyyy-MM-dd"), $scope.number, $scope.type_id, $scope.company_id, $scope.status_id, $scope.currency_id, $scope.tax_id, $scope.note, $scope.price, $scope.discount, $scope.subtotal, $scope.expense, $scope.total, $scope.tax, $scope.nettotal, $scope.discount_input, $scope.tax_input]
                        };
                        //$http.get("../../php/insert.php?params=" + JsonToString(insert_sql))
                        $http.post("../../php/insert.php", JsonToString(insert_sql))
                                .success(function (response) {
                                    if (response < 0) {
                                        alert("[1101] Error occurred while inserting an entry");
                                        return false;
                                    }
                                    $scope.id = response;

                                    // Transaction entries
                                    saveAllEntries();

                                    // Updating list entry
                                    var select_sql = {
                                        select: ["tro.id id", "tro.type_id type_id", "tro.number number", "DATE_FORMAT(tro.date, '%Y-%m-%d') date", "tro.due_date due_date", "tro.company_id company_id", "tro.status_id status_id", "tro.currency_id currency_id", "ac.name company_name", "pe1.name type_name", "pe2.name status_name", "tro.price price", "tro.discount discount", "tro.subtotal subtotal", "tro.expense expense", "tro.total total", "tro.tax tax", "tro.nettotal nettotal", "tro.note note", "ac.type_id company_type_id", "pe3.name company_type", "tro.discount_input discount_input", "tro.tax_id tax_id", "tro.tax_input tax_percent"],
                                        table: [$scope.$parent.comp_code + "transaction_order tro LEFT JOIN " + $scope.$parent.comp_code + "account_company ac ON tro.company_id = ac.id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe1 ON pe1.id = tro.type_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe2 ON pe2.id = tro.status_id LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe3 ON pe3.id = ac.type_id"],
                                        condition: ["tro.id = '" + $scope.id + "'"],
                                        order: [],
                                        limit: [1]
                                    };
                                    $http.post("../../php/select.php", JsonToString(select_sql))
                                            .success(function (response) {
                                                response = StringToJson(response);
                                                if (!angular.isArray(response)) {
                                                    alert("[1102] Error occurred while querying the database");
                                                    return false;
                                                }
                                                if (response.length > 0) {                                                    
                                                    $scope.trans_offset++;
                                                    $scope.trans_index[response[0].id] = $scope.trans_offset * (-1);
                                                    $scope.transactions.unshift(response[0]);
                                                }
                                            })
                                            .error(function () {
                                                $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                                                return false;
                                            });
                                })
                                .error(function () {
                                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                                    return false;
                                });
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });

        } else { // Updating existing entry
            $scope.edit = false;
            $scope.incomplete = true;
            //console.log("$scope.id: " + $scope.id);
            //console.log("$scope.trans_index[$scope.id]: " + $scope.trans_index[$scope.id]);
            //console.log("$scope.row_index: " + $scope.row_index);
            //console.log("$scope.currency_id: " + $scope.currency_id);
            //console.log("$scope.transactions[$scope.row_index].currency_id: " + $scope.transactions[$scope.row_index].currency_id);

            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Operations',
                eventLabel: 'Operation Update [' + $scope.params[$scope.type_id].value + " " + $scope.number + " - " + $scope.company_name + ']'
            });

            // Transaction order
            var update_sql = {
                table: [$scope.$parent.comp_code + "transaction_order"],
                field: ["date = '" + $filter('date')($scope.date, "yyyy-MM-dd") + "'",
                    "due_date = '" + $filter('date')($scope.due_date, "yyyy-MM-dd") + "'",
                    "number = '" + $scope.number + "'",
                    "type_id = '" + $scope.type_id + "'",
                    "company_id = '" + $scope.company_id + "'",
                    "status_id = '" + $scope.status_id + "'",
                    "currency_id = '" + $scope.currency_id + "'",
                    "tax_id = '" + $scope.tax_id + "'",
                    "note = '" + $scope.note + "'",
                    "price = '" + $scope.price + "'",
                    "discount = '" + $scope.discount + "'",
                    "subtotal = '" + $scope.subtotal + "'",
                    "expense = '" + $scope.expense + "'",
                    "total = '" + $scope.total + "'",
                    "tax = '" + $scope.tax + "'",
                    "tax_input = '" + $scope.tax_input + "'",
                    "nettotal = '" + $scope.nettotal + "'",
                    "discount_input = '" + $scope.discount_input + "'",
                ],
                condition: ["id = " + $scope.id]
            };
            $http.post("../../php/update.php", JsonToString(update_sql))
                    .success(function (response) {
                        if (response < 0) {
                            alert("[1102] Error occurred while updating an entry");
                            return false;
                        }
                        $scope.transactions[$scope.row_index].date = $filter('date')($scope.date, "yyyy-MM-dd");
                        $scope.transactions[$scope.row_index].due_date = $filter('date')($scope.due_date, "yyyy-MM-dd");
                        $scope.transactions[$scope.row_index].number = $scope.number;
                        $scope.transactions[$scope.row_index].type_id = $scope.type_id;
                        $scope.transactions[$scope.row_index].company_id = $scope.company_id;
                        $scope.transactions[$scope.row_index].status_id = $scope.status_id;
                        $scope.transactions[$scope.row_index].currency_id = $scope.currency_id;
                        $scope.transactions[$scope.row_index].tax_id = $scope.tax_id;
                        $scope.transactions[$scope.row_index].note = $scope.note;
                        $scope.transactions[$scope.row_index].price = $scope.price;
                        $scope.transactions[$scope.row_index].discount = $scope.discount;
                        $scope.transactions[$scope.row_index].discount_input = $scope.discount_input;
                        $scope.transactions[$scope.row_index].subtotal = $scope.subtotal;
                        $scope.transactions[$scope.row_index].expense = $scope.expense;
                        $scope.transactions[$scope.row_index].total = $scope.total;
                        $scope.transactions[$scope.row_index].tax = $scope.tax;
                        $scope.transactions[$scope.row_index].tax_input = $scope.tax_input;
                        $scope.transactions[$scope.row_index].nettotal = $scope.nettotal;
                        if ($scope.type_id > 0) {
                            $scope.transactions[$scope.row_index].type_name = $scope.params[$scope.type_id].name;
}
                        if ($scope.status_id > 0) {
                            $scope.transactions[$scope.row_index].status_name = $scope.params[$scope.status_id].name;
}
                        if ($scope.currency_id > 0) {
                            $scope.transactions[$scope.row_index].currency_name = $scope.params[$scope.currency_id].name;
 }
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });

            // Transaction entries
            saveAllEntries();
        }
    }

    // Transaction all entries
    function saveAllEntries() {
        var queries = new Object();

        // Transaction entries
        queries = saveEntries(queries);
        if (queries === false) {
            return false;
        }

        // Transaction journal entries
        queries = saveJournalEntries(queries);
        if (queries === false) {
            return false;
        }

        // Executing combined list of sql queries
        //console.log("saveAllEntries - JsonToString(queries): " + JsonToString(queries));
        $http.post("../../php/queries.php", JsonToString(queries))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1100] Error occurred while saving entries");
                        return false;
                    }
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    }

    // Transaction entries
    function saveEntries(queries) {

        // Deleting old transaction entries
        if ($scope.id !== '0') {
            var sql = {
                type: "delete",
                table: [$scope.$parent.comp_code + "transaction_entry"],
                condition: ["order_id = " + $scope.id]
            };
            queries[String(Object.keys(queries).length)] = sql;
        }

        // Inserting new transaction entries
        for (var i = 0; i < $scope.trans_entries.length; i++) {
            var e = $scope.trans_entries[i];
            if (!(e.date) || e.date.length === 0
                    || $filter('date')(e.date, "yyyy-MM-dd").startsWith('0000-00-00')) {
                e.date = new Date($filter('date')($scope.date, "yyyy-MM-dd"));
            }
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "transaction_entry"],
                field: ["order_id", "type_id", "company_id", "item_id", "code", "description", "unit_id", "quantity", "price", "discount", "discount_input", "subtotal", "expense", "total", "tax", "nettotal", "payment_id", "currency_id", "tax_id", "date"],
                value: [$scope.id, $scope.type_id, $scope.company_id, e.item_id, e.code, e.description, e.unit_id, e.quantity, e.price, e.discount, e.discount_input, e.subtotal, e.expense, e.total, e.tax, e.nettotal, e.payment_id, e.currency_id, e.tax_id, $filter('date')(e.date, "yyyy-MM-dd")]
            };
            queries[String(Object.keys(queries).length)] = sql;
        }

        return queries;
    }

    // Transaction journal entries
    function saveJournalEntries(queries) {

        // Deleting old transaction journal entries
        if ($scope.id !== '0') {
            var sql = {
                type: "delete",
                table: [$scope.$parent.comp_code + "transaction_journal"],
                condition: ["order_id = " + $scope.id]
            };
            queries[String(Object.keys(queries).length)] = sql;
            var sql = {
                type: "delete",
                table: [$scope.$parent.comp_code + "transaction_perpetual"],
                condition: ["order_id = " + $scope.id]
            };
            queries[String(Object.keys(queries).length)] = sql;
        }

        if (Number($scope.nettotal) === 0) {
            return queries;
        }

        switch ($scope.type_id) {
            case "401002": // Sales Invoice
            case "401016": // Cash Sales Invoice
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404015"].value), $scope.company_id, $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                if (Number($scope.discount) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404003"].value), "0", $scope.discount, "0.0", $scope.currency_id, "0", "0");
                }
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404001"].value), "0", "0.0", $scope.price, $scope.currency_id, "0", "0");
                if (Number($scope.tax) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404013"].value), "0", "0.0", $scope.tax, $scope.currency_id, "0", "0");
                }
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404005"].value), "0", e.nettotal, "0.0", $scope.currency_id, e.item_id, e.quantity * (-1));
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404020"].value), "0", "0.0", e.nettotal, $scope.currency_id, e.item_id, e.quantity * (-1));
                }
                if ($scope.type_id === "401016") {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params[$scope.params["408003"].value].value), "0", $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404015"].value), $scope.company_id, "0.0", $scope.nettotal, $scope.currency_id, "0", "0");
                }
                break;
            case "401014": // Invoice Return
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404015"].value), $scope.company_id, $scope.nettotal * (-1), "0.0", $scope.currency_id, "0", "0");
                if (Number($scope.discount) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404003"].value), "0", $scope.discount * (-1), "0.0", $scope.currency_id, "0", "0");
                }
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404001"].value), "0", "0.0", $scope.price * (-1), $scope.currency_id, "0", "0");
                if (Number($scope.tax) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404013"].value), "0", "0.0", $scope.tax * (-1), $scope.currency_id, "0", "0");
                }
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404005"].value), "0", e.nettotal * (-1), "0.0", $scope.currency_id, e.item_id, e.quantity);
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404020"].value), "0", "0.0", e.nettotal * (-1), $scope.currency_id, e.item_id, e.quantity);
                }
                break;
            case "401003": // Receipt Voucher
            case "401004": // Credit Note
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    if (e.payment_id === "0") {
                        //alert("Please select a type for row " + (i + 1));
                        //return false;
                        e.payment_id = "408003";
                    }
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params[$scope.params[e.payment_id].value].value), "0", e.nettotal, "0.0", $scope.currency_id, "0", "0");
                }
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404015"].value), $scope.company_id, "0.0", $scope.nettotal, $scope.currency_id, "0", "0");
                break;
            case "401006": // Purchase Invoice
            case "401017": // Cash Purchase Invoice
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404005"].value), "0", $scope.price, "0.0", $scope.currency_id, "0", "0");
                if (Number($scope.tax) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404014"].value), "0", $scope.tax, "0.0", $scope.currency_id, "0", "0");
                }
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404016"].value), $scope.company_id, "0.0", $scope.nettotal, $scope.currency_id, "0", "0");
                if (Number($scope.discount) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404007"].value), "0", "0.0", $scope.discount, $scope.currency_id, "0", "0");
                }
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404020"].value), "0", e.nettotal, "0.0", $scope.currency_id, e.item_id, e.quantity);
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404005"].value), "0", "0.0", e.nettotal, $scope.currency_id, e.item_id, e.quantity);
                }
                if ($scope.type_id === "401017") {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404016"].value), $scope.company_id, $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params[$scope.params["408003"].value].value), "0", "0.0", $scope.nettotal, $scope.currency_id, "0", "0");
                }
                break;
            case "401015": // Purchase Return
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404005"].value), "0", $scope.price * (-1), "0.0", $scope.currency_id, "0", "0");
                if (Number($scope.tax) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404014"].value), "0", $scope.tax * (-1), "0.0", $scope.currency_id, "0", "0");
                }
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404016"].value), $scope.company_id, "0.0", $scope.nettotal * (-1), $scope.currency_id, "0", "0");
                if (Number($scope.discount) !== 0) {
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404007"].value), "0", "0.0", $scope.discount * (-1), $scope.currency_id, "0", "0");
                }
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404020"].value), "0", e.nettotal * (-1), "0.0", $scope.currency_id, e.item_id, e.quantity * (-1));
                    queries[String(Object.keys(queries).length)] = savePerpetualEntry(String($scope.params["404005"].value), "0", "0.0", e.nettotal * (-1), $scope.currency_id, e.item_id, e.quantity * (-1));
                }
                break;
            case "401007": // Payment Voucher
            case "401008": // Debit Note
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404016"].value), $scope.company_id, $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    if (e.payment_id === "0") {
                        //alert("Please select a type for row " + (i + 1));
                        //return false;
                        e.payment_id = "408003";
                    }
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params[$scope.params[e.payment_id].value].value), "0", "0.0", e.nettotal, $scope.currency_id, "0", "0");
                }
                break;
            case "401010": // Journal Voucher
                //saveJournalEntry(String($scope.params["404015"].value), $scope.company_id, $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                //saveJournalEntry(String($scope.params["404001"].value), $scope.company_id, "0.0", $scope.nettotal, $scope.currency_id, "0", "0");
                break;
            case "401011": // Bank Deposit
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404010"].value), $scope.company_id, $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    if (e.payment_id === "0") {
                        //alert("Please select a type for row " + (i + 1));
                        //return false;
                        e.payment_id = "408003";
                    }
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params[$scope.params[e.payment_id].value].value), "0", "0.0", e.nettotal, $scope.currency_id, "0", "0");
                }
                break;
            case "401012": // Cash Deposit
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404012"].value), $scope.company_id, $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    if (e.payment_id === "0") {
                        //alert("Please select a type for row " + (i + 1));
                        //return false;
                        e.payment_id = "408003";
                    }
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params[$scope.params[e.payment_id].value].value), "0", "0.0", e.nettotal, $scope.currency_id, "0", "0");
                }
                break;
            case "401013": // Expenses
                queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params["404021"].value), $scope.company_id, $scope.nettotal, "0.0", $scope.currency_id, "0", "0");
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    var e = $scope.trans_entries[i];
                    if (e.payment_id === "0") {
                        //alert("Please select a type for row " + (i + 1));
                        //return false;
                        e.payment_id = "408003";
                    }
                    queries[String(Object.keys(queries).length)] = saveJournalEntry(String($scope.params[$scope.params[e.payment_id].value].value), "0", "0.0", e.nettotal, $scope.currency_id, "0", "0");
                }
                break;
        }

        return queries;
    }
    function saveJournalEntry(code, company_id, debit, credit, currency_id, item_id, quantity) {
        //console.log("saveJournalEntry - code: [" + code + "]");
        var sql = {
            type: "insert",
            table: [$scope.$parent.comp_code + "transaction_journal"],
            field: ["ledger_id", "company_id", "item_id", "quantity", "debit", "credit", "currency_id", "date", "type_id", "order_id", "number", "note"],
            value: [String(params_by_code[code].id), company_id, item_id, quantity, debit, credit, currency_id, $filter('date')($scope.date, "yyyy-MM-dd"), $scope.type_id, $scope.id, $scope.number, $scope.note]
        };
        return sql;
    }
    function savePerpetualEntry(code, company_id, debit, credit, currency_id, item_id, quantity) {
        //console.log("savePerpetualEntry - code: [" + code + "]");
        var sql = {
            type: "insert",
            table: [$scope.$parent.comp_code + "transaction_perpetual"],
            field: ["ledger_id", "company_id", "item_id", "quantity", "debit", "credit", "currency_id", "date", "type_id", "order_id", "number", "note"],
            value: [String(params_by_code[code].id), company_id, item_id, quantity, debit, credit, currency_id, $filter('date')($scope.date, "yyyy-MM-dd"), $scope.type_id, $scope.id, $scope.number, $scope.note]
        };
        return sql;
    }
//    function savePerpetualSalesEntry(currency_id, item_id, quantity) {
//        //console.log("savePerpetualSalesEntry - item_id: [" + item_id + "]");
//        var select_sql = {
//            select: ["(SUM(debit) / SUM(quantity)) amount"],
//            table: [$scope.$parent.comp_code + "transaction_perpetual"],
//            condition: ["item_id = " + item_id + " AND currency_id = " + currency_id + " AND ledger_id = 213081 AND quantity != 0 AND debit != 0.0"],
//            group: ["item_id", "currency_id"],
//            order: [],
//            limit: []
//        };
//        //$http.get("../../php/select.php?params=" + JsonToString(select_sql))
//        $http.post("../../php/select.php", JsonToString(select_sql))
//                .success(function (response) {
//                    response = StringToJson(response);
//                    if (!angular.isArray(response)) {
//                        alert("[1117] Error occurred while querying the database");
//                        return false;
//                    }
//                    if (response.length > 0) {
//                        //console.log("response[0].amount: [" + Number(response[0].amount).toFixed(2) + "]");
//                        savePerpetualEntry(String($scope.params["404005"].value), "0", (Number(response[0].amount).toFixed(2) * Number(quantity)), "0.0", currency_id, item_id, String(Number(quantity) * (-1)));
//                        savePerpetualEntry(String($scope.params["404020"].value), "0", "0.0", (Number(response[0].amount).toFixed(2) * Number(quantity)), currency_id, item_id, String(Number(quantity) * (-1)));
//                    }
//                })
//                .error(function () {
//                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
//                    return false;
//                });
//    }

    // Return to entry list from editing form
    $scope.returnToList = function () {
        $scope.edit = false;
        $scope.show_ops_list = true;
        $scope.show_type_list = false;
        $scope.show_company_list = false;
        $scope.show_item_list = false;
    };

    // Back button action from transaction form
    $scope.backFromTransaction = function () {
        if ($scope.id === '0') {
            $scope.showCompanyList();
        } else {
            $scope.returnToList();
        }
    };

    // Remove transation entry
    $scope.removeTransEntry = function (index) {
        if (index >= 0 && index < $scope.trans_entries.length) {
            $scope.trans_entries.splice(index, 1);
            $scope.item_list.splice(index, 1);
            $scope.setTotalAmounts();
        }
    };

    // Remove all transation entries
    $scope.removeAllEntries = function () {
        $scope.trans_entries = [];
        $scope.item_list = [];
        $scope.setTotalAmounts();
    };

    $scope.setAllAmounts = function () {
        for (var i = 0; i < $scope.trans_entries.length; i++) {
            $scope.setEntryAmounts(i);
        }
        $scope.setTotalAmounts();
    };

    $scope.setAmounts = function (i) {
        $scope.setEntryAmounts(i);
        $scope.setTotalAmounts();
    };

    $scope.changeCurrency = function () {
        $scope.getAccountBalance();
    };

    // Calculate transaction row amounts
    $scope.setEntryAmounts = function (i) {
        var price = 0.0;
        var quantity = 0.0;
        var rate = 0.0;
        var total = 0.0;
        var discount_input = "";
        var discount_num = 0.0;
        var discount_index = 0;
        var expense = 0.0;
        var expense_num = 0.0;
        var tax = 0.0;
        var tax_num = 0.0;
        //var tax_id = 0;
        //var tax_index = 0;
        //var main_tax_id = Number($scope.tax_id);
        var currency_rate = Number($scope.params[$scope.currency_id].value);
        //console.log("\n");
        //console.log("currency: " + $scope.currency_id + " " + currency_rate);
        //
        // Calculating the total amount of a specific table entry
        if (i >= 0 && i < $scope.trans_entries.length) {
            // temp variables initialization
            price = 0.0;
            quantity = 0.0;
            rate = 0.0;
            total = 0.0;
            discount_input = "";
            discount_num = 0.0;
            discount_index = 0;
            expense = 0.0;
            expense_num = 0.0;
            tax = 0.0;
            tax_num = 0.0;
            //tax_id = 0;
            //tax_index = 0;
            //
            // subtotal
            price = Number(Number($scope.trans_entries[i].price).toFixed(2));
            quantity = Number(Number($scope.trans_entries[i].quantity).toFixed(2));
            total = Number(Number(price * quantity).toFixed(2));
            //console.log(i + " - 01 - price: " + $scope.trans_entries[i].price);
            //console.log(i + " - 01 - quantity: " + $scope.trans_entries[i].quantity);            
            //console.log(i + " - 01 - total: " + total);

            // discount
            //console.log(i + " - 02.1 - " + $scope.trans_entries[i].discount_input);
            discount_input = (String($scope.trans_entries[i].discount_input)).trim();
            if (discount_input === "null" || discount_input === "undefined" || discount_input === "NaN") {
                discount_input = "";
            }
            if (discount_input.length === 0) {
                discount_input = "0";
            }
            discount_index = discount_input.indexOf("%");
            if (discount_index >= 0) {
                discount_input = discount_input.substr(0, discount_index);
                discount_num = Number(Number(discount_input).toFixed(2));
                total = total - (discount_num * total / 100);
            } else {
                discount_num = Number(Number(discount_input).toFixed(2));
                total = total - discount_num;
            }
            //console.log(i + " - 02.2 - " + total + " " + discount_num);
            //
            // tax
            /*
             tax_id = Number($scope.trans_entries[i].tax_id);
             if (tax_id > 0) {
             tax = String($scope.params[tax_id].value);
             tax_index = tax.indexOf("%");
             if (tax_index >= 0) {
             tax = tax.substr(0, tax_index);
             tax_num = Number(tax) * total / 100;
             } else {
             tax_num = Number(tax);
             }
             //if (main_tax_id === 406003) { // tax excluded from prices
             //    total += tax_num;
             //}
             }
             */
            //console.log(i + " - 03 - " + total);
            //
            // Total depending on currency selection
            if (Number($scope.trans_entries[i].currency_id) > 0) {
                $scope.trans_entries[i].currency_rate = $scope.params[$scope.trans_entries[i].currency_id].value;
                //console.log(total + " " + $scope.trans_entries[i].currency_id + " " + $scope.trans_entries[i].currency_rate);
                if ($scope.trans_entries[i].currency_id > 0 && $scope.currency_id > 0
                        && $scope.trans_entries[i].currency_id !== $scope.currency_id) {
                    rate = Number($scope.trans_entries[i].currency_rate);
                    total = total / rate * currency_rate;
                }
            }
            //console.log(i + " - 04 - " + total);
            //
            //$scope.trans_entries[i].price = price.toFixed(2);
            //$scope.trans_entries[i].quantity = quantity.toFixed(2);
            $scope.trans_entries[i].amount = total.toFixed(2);
            $scope.trans_entries[i].total = total.toFixed(2);
            $scope.trans_entries[i].subtotal = (total + discount_num).toFixed(2);
            $scope.trans_entries[i].nettotal = total.toFixed(2);
            $scope.trans_entries[i].tax = tax_num.toFixed(2);
            $scope.trans_entries[i].expense = expense_num.toFixed(2);
            $scope.trans_entries[i].discount = discount_num.toFixed(2);

//            if ($scope.trans_entries[i].payment_id.length === 0) {
//                $scope.trans_entries[i].payment_id = "0";
//            }
//            if ($scope.trans_entries[i].currency_id.length === 0) {
//                $scope.trans_entries[i].currency_id = $scope.currency_id;
//            }
//            if ($scope.trans_entries[i].date.length === 0) {
//                $scope.trans_entries[i].date = $scope.date;
//            }
        }
    };

    // Calculate transaction total amounts
    $scope.setTotalAmounts = function () {
        $scope.quantity = 0.0;
        $scope.price = 0.0;
        $scope.subtotal = 0.0;
        $scope.expense = 0.0;
        $scope.total = 0.0;
        $scope.tax = 0.0;
        $scope.tax_input = 0.0;
        $scope.nettotal = 0.0;
        //
        // Price and quantity
        //console.log("$scope.currency_id: " + $scope.currency_id);
        //console.log("$scope.currency_rate: " + $scope.currency_rate);
        var quantity = 0.0;
        var gross = 0.0;
        //var tax = 0.0;
        for (var i = 0; i < $scope.trans_entries.length; i++) {
            quantity += Number($scope.trans_entries[i].quantity);
            gross += Number($scope.trans_entries[i].nettotal);
            //tax += Number($scope.trans_entries[i].tax);
        }
        $scope.quantity = quantity;
        $scope.price = gross;
        //$scope.tax = tax;
        //console.log("price: " + $scope.price + "  quantity: " + $scope.quantity + "  tax: " + $scope.tax);
        //
        // Discount & Subtotal
        var discount_num = 0.0;
        if ($scope.price !== 0) {
            if ($scope.discount_input === "null" || $scope.discount_input === "undefined" || $scope.discount_input === "NaN") {
                $scope.discount_input = "";
            }
            var discount_input = (String($scope.discount_input)).trim();
            if (discount_input.length === 0) {
                discount_input = "0";
                discount_num = 0.0;
            } else {
                var d = discount_input.indexOf("%");
                if (d >= 0) {
                    discount_num = Number(Number(discount_input.substr(0, d)).toFixed(2)) * $scope.price / 100;
                } else {
                    discount_num = Number(Number(discount_input).toFixed(2));
                }
            }
            $scope.discount = discount_num;
            $scope.subtotal = $scope.price - $scope.discount;
            //console.log("subtotal: " + $scope.subtotal + "  discount: " + $scope.discount);
            //
            // Expenses and total
            var expense = Number($scope.expense);
            $scope.total = $scope.subtotal + expense;
            //console.log("total: " + $scope.total);
            //
            // Tax and nettotal
            var tax_percent = 0.0;
            var main_tax_id = Number($scope.tax_id);
            if (main_tax_id === 406002 || main_tax_id === 406003) {
                var discount_percent = discount_num / gross;
                var tax = "0.0";
                var tax_total = 0.0;
                var tax_num = 0.0;
                var tax_id = 0;
                var tax_index = 0;
                var price = 0.0;
                for (var i = 0; i < $scope.trans_entries.length; i++) {
                    tax_id = Number($scope.trans_entries[i].tax_id);
                    if (tax_id > 0) {
                        tax = String($scope.params[tax_id].value);
                        tax_index = tax.indexOf("%");
                        if (tax_index >= 0) {
                            tax = tax.substr(0, tax_index);
                            price = Number($scope.trans_entries[i].nettotal);
                            price = price - (price * discount_percent);
                            tax_num = Number(tax) * price / 100;
                        } else {
                            var qtty = Number($scope.trans_entries[i].quantity);
                            tax_num = Number(tax) * qtty;
                        }
                        tax_total += tax_num;
                    }
                }
            }
            if (main_tax_id === 406002) { // tax included in amounts
                $scope.nettotal = $scope.total;
                if (tax_total !== 0) {
                    tax_percent = (tax_total / ($scope.nettotal - tax_total) * 100);
                }
            } else if (main_tax_id === 406003) { // tax excluded from amounts
                $scope.nettotal = $scope.total + tax_total;
                if (tax_total !== 0) {
                    tax_percent = (tax_total / $scope.total * 100);
                }
            } else {
                $scope.nettotal = $scope.total;
                tax_total = 0.0;
                tax_percent = 0.0;
            }
            $scope.tax = tax_total.toFixed(2);
            $scope.tax_input = tax_percent.toFixed(2);

        } else {
            $scope.discount = 0;
            $scope.subtotal = 0;
            $scope.total = 0;
            $scope.tax = 0;
            $scope.tax_input = 0;
            $scope.nettotal = 0;
        }

        $scope.setAccountBalance();
    };

    // Display PDF print form
    $scope.printEntry = function (id, type_id) {
        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Operations',
            eventLabel: 'Operation Print [' + $scope.params[type_id].value + " " + $scope.number + " - " + $scope.company_name + ']'
        });

        var params = {
            language: $scope.$parent.lang_code,
            code: $scope.$parent.comp_code,
            form: [$scope.$parent.comp_code + "transaction_order"],
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

    // Display history
    $scope.getStatement = function () {
        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Operations',
            eventLabel: 'Operation Statement [' + $scope.params[$scope.type_id].value + " " + $scope.number + " - " + $scope.company_name + ']'
        });

        var params = {
            language: $scope.$parent.lang_code,
            code: $scope.$parent.comp_code,
            value: [$scope.company_id] //, "2015-01-01", "2015-12-31"]
        };
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

    // Display error message
    $scope.showErrorMessage = function (title, message) {
        $scope.msg_title = title;
        $scope.msg_body = message;
        $("#messageModal").modal("show");
    };

});