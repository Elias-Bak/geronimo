'use strict';

quickcountApp.controller('AccountCtrl', function ($scope, $http, $filter, $location, $cookies) {

    // Check if currently loading parameters
    if (loading) {
        //console.log("AccountCtrl - loading: " + loading);
        currentModule = 20;
        $location.path('/empty');
        return;
    }

    // Module
    if (currentModule === 20) {
        return;
    }
    currentModule = 20;

    // Retrieving user login session variables
    console.log("AccountCtrl - user logged: " + $scope.$parent.user_logged
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
        eventAction: 'Menu Button - Contacts',
        eventLabel: 'Contacts List'
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
    $scope.contact = '';
    $scope.terms_id = '0';
    $scope.address = '';
    $scope.city = '';
    $scope.country_id = '0';
    $scope.email = '';
    $scope.website = '';
    $scope.mobile = '';
    $scope.phone = '';

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
    if (typeof (window.account) !== "undefined") {
        $scope.processResponse(window.account, false);
    } else {
        // Main select query
        var select_sql = {
            select: ["cp.id id", "cp.type_id type_id", "cp.code code", "cp.name name", "cp.note note", "pe.name type_name", "ct.name contact", "co.name mobile", "cp.terms_id terms_id"],
            table: [$scope.$parent.comp_code + "account_company cp LEFT JOIN " + $scope.$parent.comp_code + "account_contact ct ON ct.company_id = cp.id LEFT JOIN " + $scope.$parent.comp_code + "account_coordinate co ON co.company_id = cp.id AND co.type_id = 208002 LEFT JOIN " + $scope.$parent.comp_code + "parameter_entry pe ON pe.id = cp.type_id"],
            condition: [],
            order: ["cp.name"],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    // Converting response to JSON format
                    window.account = StringToJson(response);
                    // Processing retrieved data
                    $scope.processResponse(window.account, true);
                })
                .error(
                        function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        }

                );
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
        $scope.contact = '';
        $scope.terms_id = '0';
        $scope.address = '';
        $scope.city = '';
        $scope.country_id = '0';
        $scope.email = '';
        $scope.website = '';
        $scope.mobile = '';
        $scope.phone = '';

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Contacts',
            eventLabel: 'Contact New'
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
        $scope.contact = '';
        $scope.terms_id = $scope.entries[index].terms_id;
        $scope.address = '';
        $scope.city = '';
        $scope.country_id = '0';
        $scope.email = '';
        $scope.website = '';
        $scope.phone = '';
        $scope.mobile = '';

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Contacts',
            eventLabel: 'Contact Edit [' + $scope.code + " - " + $scope.name + ']'
        });

        // Default errors
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";

        // Contact
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "account_contact ct"],
            condition: ["ct.company_id = " + $scope.id],
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
                        $scope.contact = response[0].name;
                    }
                })
                .error(
                        function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        }

                );

        // Address
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "account_branch br"],
            condition: ["br.company_id = " + $scope.id],
            order: [],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1108] Error occurred while querying the database");
                        return false;
                    }
                    if (response.length > 0) {
                        $scope.address = response[0].address;
                        $scope.city = response[0].city;
                        $scope.country_id = response[0].country_id;
                    }
                })
                .error(
                        function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        }

                );

        // Coordinates
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "account_coordinate co"],
            condition: ["co.company_id = " + $scope.id],
            order: [],
            limit: []
        };
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1109] Error occurred while querying the database");
                        return false;
                    }
                    if (response.length > 0) {
                        for (var i = 0; i < response.length; i++) {
                            if (response[i].type_id === '208001') {        // phone
                                $scope.phone = response[i].name;
                            } else if (response[i].type_id === '208002') { // mobile
                                $scope.mobile = response[i].name;
                            } else if (response[i].type_id === '208004') { // email
                                $scope.email = response[i].name;
                            } else if (response[i].type_id === '208005') { // website
                                $scope.website = response[i].name;
                            }
                        }
                    }
                })
                .error(
                        function () {
                            $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                            return false;
                        }

                );
    };

    // Save new or existing entry
    $scope.saveEntry = function () {
        // Checking for duplicates
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";

        if ($scope.code.length > 0) {
            checkDuplicateCodes();
        } else {
            checkDuplicateNames();
        }
    };

    // Checking for duplicate company codes
    function checkDuplicateCodes() {
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "account_company"],
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
        return true;
    }

    // Checking for duplicate company names
    function checkDuplicateNames() {
        select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "account_company"],
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
        return true;
    }

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
                eventAction: 'Menu Button - Contacts',
                eventLabel: 'Contact Insert [' + $scope.code + " - " + $scope.name + ']'
            });

            // Account Company
            var insert_sql = {
                table: [$scope.$parent.comp_code + "account_company"],
                field: ["type_id", "code", "name", "note", "terms_id"],
                value: [$scope.type_id, $scope.code, $scope.name, $scope.note, $scope.terms_id]
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
                            var new_entry = {id: response, type_id: $scope.type_id, code: $scope.code, name: $scope.name, note: $scope.note, terms_id: $scope.terms_id};
                            $scope.entries.push(new_entry);
                            saveAdditonalEntries($scope.entries.length - 1);
                        }
                    })
                    .error(
                            function () {
                                $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                                return false;
                            }

                    );

        } else { // Updating existing entry
            $scope.edit = false;
            $scope.incomplete = true;

            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Contacts',
                eventLabel: 'Contact Update [' + $scope.code + " - " + $scope.name + ']'
            });

            // Account company
            var update_sql = {
                table: [$scope.$parent.comp_code + "account_company"],
                field: ["type_id = '" + $scope.type_id + "'",
                    "code = '" + $scope.code + "'",
                    "name = '" + $scope.name + "'",
                    "note = '" + $scope.note + "'",
                    "terms_id = '" + $scope.terms_id + "'"
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
                        $scope.entries[$scope.row_index].terms_id = $scope.terms_id;
                        if ($scope.type_id > 0) {
                            $scope.entries[$scope.row_index].type_name = $scope.params[$scope.type_id].name;
                        } else {
                            $scope.entries[$scope.row_index].type_name = "";
                        }
                    })
                    .error(
                            function () {
                                $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                                return false;
                            }

                    );

            deleteAndSaveAdditonalEntries($scope.row_index);
        }

        return true;
    }

    // Delete and then save additional entries
    function deleteAndSaveAdditonalEntries(row_index) {

        var queries = new Object();

        // Deleting old contact info
        var sql1 = {
            type: "delete",
            table: [$scope.$parent.comp_code + "account_contact"],
            condition: ["company_id = " + $scope.id]
        };

        // Deleting old address info (main branch)
        var sql2 = {
            type: "delete",
            table: [$scope.$parent.comp_code + "account_branch"],
            condition: ["company_id = " + $scope.id]
        };

        // Deleting old coordinates
        var sql3 = {
            type: "delete",
            table: [$scope.$parent.comp_code + "account_coordinate"],
            condition: ["company_id = " + $scope.id]
        };

        queries[String(Object.keys(queries).length)] = sql1;
        queries[String(Object.keys(queries).length)] = sql2;
        queries[String(Object.keys(queries).length)] = sql3;

        queries = saveContacts(row_index, queries);
        queries = saveBranches(row_index, queries);
        queries = saveCoordinates(row_index, queries);

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
        queries = saveContacts(row_index, queries);
        queries = saveBranches(row_index, queries);
        queries = saveCoordinates(row_index, queries);

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

    // Contact persons
    function saveContacts(row_index, queries) {

        if ($scope.contact.length > 0) {
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "account_contact"],
                field: ["company_id", "name"],
                value: [$scope.id, $scope.contact]
            };
            queries[String(Object.keys(queries).length)] = sql;
            $scope.entries[row_index].contact = $scope.contact;
        }

        return queries;
    }

    // Address (main branch) 
    function saveBranches(row_index, queries) {

        if ($scope.address.length > 0 || $scope.city.length > 0 || $scope.country_id > 0) {
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "account_branch"],
                field: ["company_id", "type_id", "address", "city", "country_id"],
                value: [$scope.id, "203001", $scope.address, $scope.city, $scope.country_id]
            };
            queries[String(Object.keys(queries).length)] = sql;
            $scope.entries[row_index].address = $scope.address;
            $scope.entries[row_index].city = $scope.city;
            $scope.entries[row_index].country_id = $scope.country_id;
        }

        return queries;
    }

    // Contacts Coordinates
    function saveCoordinates(row_index, queries) {

        // Email
        if ($scope.email.length > 0) {
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "account_coordinate"],
                field: ["company_id", "type_id", "name"],
                value: [$scope.id, "208004", $scope.email]
            };
            queries[String(Object.keys(queries).length)] = sql;
            $scope.entries[row_index].email = $scope.email;
        }

        // Website
        if ($scope.website.length > 0) {
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "account_coordinate"],
                field: ["company_id", "type_id", "name"],
                value: [$scope.id, "208005", $scope.website]
            };
            queries[String(Object.keys(queries).length)] = sql;
            $scope.entries[row_index].website = $scope.website;
        }

        // Mobile
        if ($scope.mobile.length > 0) {
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "account_coordinate"],
                field: ["company_id", "type_id", "name"],
                value: [$scope.id, "208002", $scope.mobile]
            };
            queries[String(Object.keys(queries).length)] = sql;
            $scope.entries[row_index].mobile = $scope.mobile;
        }

        // Phone
        if ($scope.phone.length > 0) {
            var sql = {
                type: "insert",
                table: [$scope.$parent.comp_code + "account_coordinate"],
                field: ["company_id", "type_id", "name"],
                value: [$scope.id, "208001", $scope.phone]
            };
            queries[String(Object.keys(queries).length)] = sql;
            $scope.entries[row_index].phone = $scope.phone;
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
            value: [$scope.id] //, "2015-01-01", "2015-12-31"]
        };
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