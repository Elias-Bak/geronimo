'use strict';

quickcountApp.controller('InventoryCtrl', function ($scope, $http, $filter, $location, $cookies) {

    // Check if currently loading parameters
    if (loading) {
        //console.log("InventoryCtrl - loading: " + loading);
        currentModule = 30;
        $location.path('/empty');
        return;
    }

    // Module
    if (currentModule === 30) {
        return;
    }
    currentModule = 30;

    // Retrieving user login session variables
    console.log("InventoryCtrl - user logged: " + $scope.$parent.user_logged
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
        eventAction: 'Menu Button - Products',
        eventLabel: 'Products List'
    });

    // Main entry list
    $scope.entries = [];
    $scope.entry_index = new Object();

    // Form data variables
    $scope.id = '0';
    $scope.type_id = '0';
    $scope.code = '';
    $scope.name = '';
    $scope.note = '';
    $scope.tax_id = '0';
    $scope.unit_id = '0';
    $scope.currency_id = '0';
    $scope.amount = '';

    // Control flag variables
    $scope.create = false;
    $scope.edit = false;
    $scope.error = false;
    $scope.incomplete = false;

    // Message text variables
    $scope.msg_title = '';
    $scope.msg_body = '';
    $scope.error_code_type = "";
    $scope.error_code_sign = "";
    $scope.error_name_type = "";
    $scope.error_name_sign = "";

    // Table grid pagination variables
    $scope.search = "";
    $scope.itemsPerPage = 10;
    $scope.currentPage = 0;
    $scope.pageCount = 0;
    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };
    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pageCount) {
            $scope.currentPage++;
        }
    };
    $scope.prevPageDisabled = function () {
        return $scope.currentPage === 0 ? "disabled" : "";
    };
    $scope.nextPageDisabled = function () {
        return $scope.currentPage === $scope.pageCount ? "disabled" : "";
    };
    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };
    $scope.$watch('search', function () {
        var filtered = $filter('filter')($scope.entries, $scope.search);
        $scope.pageCount = Math.ceil(filtered.length / $scope.itemsPerPage) - 1;
        if ($scope.pageCount < 0) {
            $scope.pageCount = 0;
        }
    });

    // Input data validation
    $scope.$watch('code', function () {
        $scope.test();
    });
    $scope.$watch('name', function () {
        $scope.test();
    });
    $scope.test = function () {
        $scope.error = false;
        $scope.incomplete = false;
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";
        if ($scope.edit) {
            if (!$scope.code.length) {
                $scope.incomplete = true;
                $scope.error_code_type = "has-warning";
                $scope.error_code_sign = "glyphicon-warning-sign";
            } else {
                //$scope.error_code_type = "has-success";
                //$scope.error_code_sign = "glyphicon-ok";
            }
            if (!$scope.name.length) {
                $scope.incomplete = true;
                $scope.error_name_type = "has-warning";
                $scope.error_name_sign = "glyphicon-warning-sign";
            } else {
                //$scope.error_name_type = "has-success";
                //$scope.error_name_sign = "glyphicon-ok";
            }
        }
    };

    // Processing response data from server
    $scope.processResponse = function (response) {
        if (!angular.isArray(response)) {
            alert("[1106] Error occurred while querying the database");
            return;
        }
        $scope.entries = response;
        for (var i = 0; i < response.length; i++) {
            $scope.entry_index[response[i].id] = i;
        }
        $scope.pageCount = Math.ceil($scope.entries.length / $scope.itemsPerPage) - 1;
        if ($scope.pageCount < 0) {
            $scope.pageCount = 0;
        }
    };

    // Getting cached data if available
    if (typeof (window.inventory) !== "undefined") {
        $scope.processResponse(window.inventory, false);
    } else {
        // Main select query
        var select_sql = {
            select: ["it.id id", "it.type_id type_id", "it.code code", "it.name name", "it.note note", "pe.name type_name", "ia.tax_id tax_id", "ia.unit_id unit_id", "ia.currency_id currency_id", "ia.amount amount"],
            table: [$scope.$parent.comp_code + "inventory_item it LEFT JOIN " + $scope.$parent.comp_code + "inventory_amount ia ON ia.item_id = it.id AND ia.type_id = 305002 LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe ON pe.id = it.type_id"],
            condition: [],
            order: ["it.code"],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    // Converting response to JSON format
                    window.inventory = StringToJson(response);
                    // Processing retrieved data
                    $scope.processResponse(window.inventory, true);
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    }

    // New entry
    $scope.newEntry = function () {
        $scope.create = true;
        $scope.edit = true;
        $scope.incomplete = true;
        $scope.duplicate = false;
        $scope.row_index = -1;
        $scope.id = '0';
        $scope.type_id = '0';
        $scope.code = '';
        $scope.name = '';
        $scope.note = '';
        $scope.tax_id = '0';
        $scope.unit_id = '0';
        $scope.currency_id = '0';
        $scope.amount = '';

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Products',
            eventLabel: 'Product New'
        });
    };

    // Edit existing entry
    $scope.editEntry = function (index) {
        $scope.create = false;
        $scope.edit = true;
        $scope.incomplete = false;
        $scope.duplicate = false;
        $scope.row_index = index;
        $scope.id = $scope.entries[index].id;
        $scope.type_id = $scope.entries[index].type_id;
        $scope.code = $scope.entries[index].code;
        $scope.name = $scope.entries[index].name;
        $scope.note = $scope.entries[index].note;
        $scope.tax_id = '0';
        $scope.unit_id = '0';
        $scope.currency_id = '0';
        $scope.amount = '';

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Products',
            eventLabel: 'Product Edit [' + $scope.code + " - " + $scope.name + ']'
        });

        // Default errors
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";

        // Amount
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "inventory_amount am"],
            condition: ["am.item_id = " + $scope.id + " AND am.type_id = 305002"],
            order: [],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1107] Error occurred while querying the database");
                        return false;
                    }
                    if (response.length > 0) {
                        $scope.tax_id = response[0].tax_id;
                        $scope.unit_id = response[0].unit_id;
                        $scope.currency_id = response[0].currency_id;
                        $scope.amount = Number(response[0].amount).toFixed(2);
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
        checkDuplicateCodes();
    };

    // Checking for duplicate company codes
    function checkDuplicateCodes() {
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "inventory_item"],
            condition: ['UPPER(code) = UPPER("' + $scope.code + '") AND id != ' + $scope.id],
            order: [],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1104] Error occurred while querying the database");
                        return false;
                    }
                    if (response.length > 0) {
                        $scope.msg_title = 'Incorrect Data';
                        $scope.msg_body = 'Code already exists in the list!';
                        $("#messageModal").modal("show");
                        $scope.error_code_type = "has-error";
                        $scope.error_code_sign = "glyphicon-remove";
                    } else {
                        checkDuplicateNames();
                    }
                })
                .error(
                        function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        }

                );
    }
    ;

    // Checking for duplicate company names
    function checkDuplicateNames() {
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "inventory_item"],
            condition: ['UPPER(name) = UPPER("' + $scope.name + '") AND id != ' + $scope.id],
            order: [],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1105] Error occurred while querying the database");
                        return false;
                    }
                    if (response.length > 0) {
                        $scope.msg_title = 'Incorrect Data';
                        $scope.msg_body = 'Name already exists in the list!';
                        $("#messageModal").modal("show");
                        $scope.error_name_type = "has-error";
                        $scope.error_name_sign = "glyphicon-remove";
                    } else {
                        saveCompany();
                    }
                })
                .error(
                        function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        }

                );
    }
    ;

    // Company info
    function saveCompany() {
        // Inserting new entry
        if ($scope.id === '0') {
            $scope.edit = false;
            $scope.incomplete = true;

            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Products',
                eventLabel: 'Product Insert [' + $scope.code + " - " + $scope.name + ']'
            });

            // Inventory Item
            var insert_sql = {
                table: [$scope.$parent.comp_code + "inventory_item"],
                field: ["type_id", "code", "name", "note"],
                value: [$scope.type_id, $scope.code, $scope.name, $scope.note]
            };
            $http.post("../../php/insert.php", JsonToString(insert_sql))
                    .success(function (response) {
                        if (response < 0) {
                            alert("[1101] Error occurred while inserting an entry");
                            return false;
                        }
                        // Updating list entry
                        if (response.length > 0) {
                            $scope.id = response;
                            $scope.entry_index[response] = $scope.entries.length;
                            var new_entry = {id: response, type_id: $scope.type_id, code: $scope.code, name: $scope.name, note: $scope.note};
                            $scope.entries.push(new_entry);
                            saveAdditonalEntries($scope.entries.length - 1);                            
                        }
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });

        } else { // Updating existing entry
            $scope.edit = false;
            $scope.incomplete = true;

            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Products',
                eventLabel: 'Product Update [' + $scope.code + " - " + $scope.name + ']'
            });

            // Account company
            var update_sql = {
                table: [$scope.$parent.comp_code + "inventory_item"],
                field: ["type_id = '" + $scope.type_id + "'",
                    "code = '" + $scope.code + "'",
                    "name = '" + $scope.name + "'",
                    "note = '" + $scope.note + "'"
                ],
                condition: ["id = " + $scope.id]
            };
            $http.post("../../php/update.php", JsonToString(update_sql))
                    .success(function (response) {
                        if (response < 0) {
                            alert("[1102] Error occurred while updating an entry");
                            return false;
                        }
                        $scope.entries[$scope.row_index].type_id = $scope.type_id;
                        $scope.entries[$scope.row_index].code = $scope.code;
                        $scope.entries[$scope.row_index].name = $scope.name;
                        $scope.entries[$scope.row_index].note = $scope.note;
                        if ($scope.type_id > 0) {
                            $scope.entries[$scope.row_index].type_name = $scope.params[$scope.type_id].name;
                        }
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });

            deleteAndSaveAdditonalEntries($scope.row_index);
        }
    }

    // Delete and then save additional entries
    function deleteAndSaveAdditonalEntries(row_index) {

        var queries = new Object();

        // Deleting old amount info
        var sql1 = {
            type: "delete",
            table: [$scope.$parent.comp_code + "inventory_amount"],
            condition: ["item_id = " + $scope.id]
        };

        queries[String(Object.keys(queries).length)] = sql1;

        queries = saveAmounts(row_index, queries);

        // Executing combined list of sql queries
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

    // Saving additional entries
    function saveAdditonalEntries(row_index) {

        var queries = new Object();
        queries = saveAmounts(row_index, queries);

        // Executing combined list of sql queries
        if (Object.keys(queries).length > 0) {
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
    }

    // Item amounts
    function saveAmounts(row_index, queries) {
        if ($scope.amount.length > 0 || $scope.tax_id > 0 || $scope.unit_id > 0 || $scope.currency_id > 0) {
            $scope.amount = Number($scope.amount).toFixed(2);
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "inventory_amount"],
                field: ["item_id", "type_id", "amount", "tax_id", "unit_id", "currency_id"],
                value: [$scope.id, "305002", $scope.amount, $scope.tax_id, $scope.unit_id, $scope.currency_id]
            };
            queries[String(Object.keys(queries).length)] = sql;
            $scope.entries[row_index].amount = $scope.amount;
            $scope.entries[row_index].tax_id = $scope.tax_id;
            $scope.entries[row_index].unit_id = $scope.unit_id;
            $scope.entries[row_index].currency_id = $scope.currency_id;
        }

        return queries;
    }

    // Return to entry list from editing form
    $scope.returnToList = function () {
        $scope.edit = false;
    };

    // Display history
    $scope.getHistory = function () {
        var params = {
            language: $scope.$parent.lang_code,
            code: $scope.$parent.comp_code,
            value: [$scope.id, "", ""]
        };
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
                .error(
                        function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        }

                );
    };

    // Display error message
    $scope.showErrorMessage = function (title, message) {
        $scope.msg_title = title;
        $scope.msg_body = message;
        $("#messageModal").modal("show");
    };

});