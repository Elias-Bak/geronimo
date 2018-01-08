'use strict';

quickcountApp.controller('ParameterCtrl', function ($scope, $http, $filter, $base64, $location) {

    // Check if currently loading parameters
    if (loading) {
        //console.log("ParameterCtrl - loading: " + loading);
        currentModule = 60;
        $location.path('/empty');
        return;
    }

    // Module
    if (currentModule === 60) {
        return;
    }
    currentModule = 60;
    
    // Retrieving user login session variables
    console.log("ParameterCtrl - user logged: " + $scope.$parent.user_logged
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
        eventAction: 'Menu Button - Parameters',
        eventLabel: 'Parameters List'
    });

    // Main entry list
    $scope.entries = [];
    $scope.entry_index = new Object();

    // Form data variables
    $scope.id = '0';
    $scope.group_id = '0';
    $scope.type_id = '0';
    $scope.status_id = '0';
    $scope.option_id = '0';
    $scope.language_id = '0';
    $scope.entry_id = '0';
    $scope.group_code = '';
    $scope.code = '';
    $scope.name = '';
    $scope.value = '';
    $scope.value_locale = '';
    $scope.description = '';
    $scope.description_locale = '';
    $scope.name_sound = '';
    $scope.note = '';
    $scope.file = '';

    // Control flag variables
    $scope.create = false;
    $scope.edit = false;
    $scope.error = false;
    $scope.incomplete = false;
    $scope.show_param_list = false;

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
        //console.log("entries: " + $scope.entries.length);
        //console.log("filtered: " + filtered.length);
        $scope.pageCount = Math.ceil(filtered.length / $scope.itemsPerPage) - 1;
        if ($scope.pageCount < 0) {
            $scope.pageCount = 0;
        }
    });

    // Input data validation
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

    // Uploading file data
    $scope.uploadFile = function () {
        console.log("files: " + document.getElementById('file').files.length);
        if (document.getElementById('file').files.length > 0) {
            var f = document.getElementById('file').files[0];
            var r = new FileReader();
            r.onloadend = function (e) {
                //$scope.file = $base64.encode(unescape(encodeURIComponent(e.target.result)));
                $scope.file = $base64.encode(e.target.result);
                //send you binary data via $http or $resource or do anything else with it
//            $scope.encoded = $base64.encode(unescape(encodeURIComponent('✓ a string')));
//            $scope.decoded = decodeURIComponent(escape($base64.decode('4pyTIGEgc3RyaW5n')));
//            console.log("$scope.encoded: [" + $scope.encoded + "]");
//            console.log("$scope.decoded: [" + $scope.decoded + "]");
//            $scope.encoded = $base64.encode('a string');
//            $scope.decoded = $base64.decode('YSBzdHJpbmc=');
//            console.log("\n\n\n");
//            console.log("file value: [" + $scope.file + "]");
//            console.log("\n\n\n");
//            console.log("file value: [" + $base64.encode(unescape(encodeURIComponent($scope.file))) + "]");
//            console.log($scope.file);
            };
            r.readAsBinaryString(f);
        }
    };
    $scope.getFile = function () {
        if ($scope.file !== null && $scope.file.length > 0 && $scope.file !== "undefined") {
            return "data:image/jpeg;base64," + $scope.file;
        } else {
            return "";
        }
    };
    $scope.deleteFile = function () {
        $scope.file = "";
    };

    // Displaying parameter group list
    $scope.showGroupList = function () {
        $scope.show_param_list = false;
    };

    // Displaying parameter list
    $scope.showParameterList = function (group_id) {
        $scope.show_param_list = true;
        $scope.group_id = group_id;
        var select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "parameter_entry"],
            condition: ["group_id = '" + $scope.group_id + "'"],
            order: ["name"],
            limit: []
        };
        //$http.get("../../php/select.php?params=" + JsonToString(select_sql))
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1206] Error occurred while querying the database");
                        return false;
                    }
                    $scope.entries = response;
                    for (var i = 0; i < response.length; i++) {
                        $scope.entry_index[response[i].id] = i;
                    }
                    $scope.pageCount = Math.ceil($scope.entries.length / $scope.itemsPerPage) - 1;
                    if ($scope.pageCount < 0) {
                        $scope.pageCount = 0;
                    }
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
    };

    // New entry
    $scope.newEntry = function () {
        $scope.create = true;
        $scope.edit = true;
        $scope.incomplete = true;
        $scope.duplicate = false;
        $scope.row_index = -1;
        $scope.id = '0';
        $scope.group_id = '0';
        $scope.type_id = '0';
        $scope.status_id = '0';
        $scope.option_id = '0';
        $scope.language_id = '0';
        $scope.entry_id = '0';
        $scope.group_code = '';
        $scope.code = '';
        $scope.name = '';
        $scope.value = '';
        $scope.value_locale = '';
        $scope.description = '';
        $scope.description_locale = '';
        $scope.name_sound = '';
        $scope.note = '';
        $scope.file = '';
        document.getElementById('file').value = '';

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Parameters',
            eventLabel: 'Parameter New'
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
        $scope.group_id = $scope.entries[index].group_id;
        $scope.type_id = $scope.entries[index].type_id;
        $scope.status_id = $scope.entries[index].status_id;
        $scope.option_id = $scope.entries[index].option_id;
        $scope.language_id = $scope.entries[index].language_id;
        $scope.entry_id = $scope.entries[index].entry_id;
        $scope.group_code = $scope.entries[index].group_code;
        $scope.code = $scope.entries[index].code;
        $scope.name = $scope.entries[index].name;
        $scope.value = $scope.entries[index].value;
        $scope.value_locale = $scope.entries[index].value;
        $scope.description = $scope.entries[index].description;
        $scope.description_locale = $scope.entries[index].description;
        $scope.name_sound = $scope.entries[index].name_sound;
        $scope.note = $scope.entries[index].note;
        $scope.file = $scope.entries[index].file;
        document.getElementById('file').value = '';

        // Google Analytics
        ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
        ga('send', {
            hitType: 'event',
            eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
            eventAction: 'Menu Button - Parameters',
            eventLabel: 'Parameter Edit [' + $scope.code + " - " + $scope.name + ']'
        });

        // Default errors
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";

        // Handling multi-language values in JSON format
        if ($scope.$parent.lang_code && $scope.value && $scope.value.startsWith("{")) {
            try {
                var json = JSON.parse($scope.value);
                if (angular.isObject(json)) {
                    if (json.hasOwnProperty($scope.$parent.lang_code)) {
                        $scope.value_locale = json[$scope.$parent.lang_code];
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }
        if ($scope.$parent.lang_code && $scope.description && $scope.description.startsWith("{")) {
            try {
                var json = JSON.parse($scope.description);
                if (angular.isObject(json)) {
                    if (json.hasOwnProperty($scope.$parent.lang_code)) {
                        $scope.description_locale = json[$scope.$parent.lang_code];
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }
    };

    // Save new or existing entry
    $scope.saveEntry = function () {
        // Checking for duplicates
        $scope.error_code_type = "";
        $scope.error_code_sign = "";
        $scope.error_name_type = "";
        $scope.error_name_sign = "";
        checkDuplicateNames();
    };

    // Checking for duplicate names
    function checkDuplicateNames() {
        var select_sql = {
            select: ["*"],
            table: [$scope.$parent.comp_code + "parameter_entry"],
            condition: ["UPPER(name) = UPPER('" + $scope.name + "') AND id != " + $scope.id],
            order: [],
            limit: []
        };
        //$http.get("../../php/select.php?params=" + JsonToString(select_sql))
        $http.post("../../php/select.php", JsonToString(select_sql))
                .success(function (response) {
                    response = StringToJson(response);
                    if (!angular.isArray(response)) {
                        alert("[1204] Error occurred while querying the database");
                        return false;
                    }
                    if (response.length > 0) {
                        $scope.msg_title = 'Incorrect Data';
                        $scope.msg_body = 'Name already exists in the list!';
                        $("#messageModal").modal("show");
                        $scope.error_code_type = "has-error";
                        $scope.error_code_sign = "glyphicon-remove";
                    } else {
                        saveInfo();
                    }
                })
                .error(function () {
                    $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                    return false;
                });
        return true;
    }

    // Saving main info
    function saveInfo() {

        // Handling multi-language values in JSON format
        if ($scope.$parent.lang_code && $scope.value && $scope.value.startsWith("{")) {
            try {
                var json = JSON.parse($scope.value);
                if (angular.isObject(json)) {
                    if (json.hasOwnProperty($scope.$parent.lang_code)) {
                        json[$scope.$parent.lang_code] = $scope.value_locale;
                        $scope.value = JSON.stringify(json);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            $scope.value = $scope.value_locale;
        }        
        if ($scope.$parent.lang_code && $scope.description && $scope.description.startsWith("{")) {
            try {
                var json = JSON.parse($scope.description);
                if (angular.isObject(json)) {
                    if (json.hasOwnProperty($scope.$parent.lang_code)) {
                        json[$scope.$parent.lang_code] = $scope.description_locale;
                        $scope.description = JSON.stringify(json);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            $scope.description = $scope.description_locale;
        }

        // Inserting new entry
        if ($scope.create) {
            $scope.edit = false;
            $scope.incomplete = true;

            // Google Analytics
            ga('set', 'userId', $scope.$parent.comp_code + "_" + $scope.$parent.user_id);
            ga('send', {
                hitType: 'event',
                eventCategory: $scope.$parent.comp_code + $scope.$parent.user_name,
                eventAction: 'Menu Button - Parameters',
                eventLabel: 'Parameters Save Insert'
            });



            $scope.name_sound = 'soundex(' + $scope.name + ')';

            // Main info
            var insert_sql = {
                table: [$scope.$parent.comp_code + "parameter_entry"],
                field: ["id", "group_id", "type_id", "status_id", "option_id", "language_id", "entry_id", "group_code", "code", "name", "value", "description", "name_sound", "note", "file"],
                value: [$scope.id, $scope.group_id, $scope.type_id, $scope.status_id, $scope.option_id, $scope.language_id, $scope.entry_id, $scope.group_code, $scope.code, $scope.name, $scope.value, $scope.description, $scope.name_sound, $scope.note, $scope.file]
            };
            //$http.get("../../php/insert.php?params=" + JsonToString(insert_sql))
            $http.post("../../php/insert.php", JsonToString(insert_sql))
                    .success(function (response) {
                        if (response < 0) {
                            alert("[1201] Error occurred while inserting an entry");
                            return false;
                        }
                        // Updating list entry
                        $scope.id = response;
                        $scope.entry_index[response] = $scope.entries.length;
                        var new_entry = {id: response, group_id: $scope.group_id, type_id: $scope.type_id, status_id: $scope.status_id, option_id: $scope.option_id, language_id: $scope.language_id, entry_id: $scope.entry_id, group_code: $scope.group_code, code: $scope.code, name: $scope.name, value: $scope.value, description: $scope.description, name_sound: $scope.name_sound, note: $scope.note, file: $scope.file};
                        $scope.entries.push(new_entry);
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
                eventAction: 'Menu Button - Parameters',
                eventLabel: 'Parameters Save Update'
            });

            // Account company
            var update_sql = {
                table: [$scope.$parent.comp_code + "parameter_entry"],
                field: [
                    "group_id = '" + $scope.group_id + "'",
                    "type_id = '" + $scope.type_id + "'",
                    "status_id = '" + $scope.status_id + "'",
                    "option_id = '" + $scope.option_id + "'",
                    "language_id = '" + $scope.language_id + "'",
                    "entry_id = '" + $scope.entry_id + "'",
                    "group_code = '" + $scope.group_code + "'",
                    "code = '" + $scope.code + "'",
                    "name = '" + $scope.name + "'",
                    "value = '" + $scope.value + "'",
                    "description = '" + $scope.description + "'",
                    "name_sound = soundex('" + $scope.name + "')",
                    "note = '" + $scope.note + "'",
                    "file = '" + $scope.file + "'"
                ],
                condition: ["id = " + $scope.id]
            };
            //$http.get("../../php/update.php?params=" + JsonToString(update_sql))
            $http.post("../../php/update.php", JsonToString(update_sql))
                    .success(function (response) {
                        if (response < 0) {
                            alert("[1202] Error occurred while updating an entry");
                            return false;
                        }
                        $scope.entries[$scope.row_index].group_id = $scope.group_id;
                        $scope.entries[$scope.row_index].type_id = $scope.type_id;
                        $scope.entries[$scope.row_index].status_id = $scope.status_id;
                        $scope.entries[$scope.row_index].language_id = $scope.language_id;
                        $scope.entries[$scope.row_index].entry_id = $scope.entry_id;
                        $scope.entries[$scope.row_index].group_code = $scope.group_code;
                        $scope.entries[$scope.row_index].code = $scope.code;
                        $scope.entries[$scope.row_index].name = $scope.name;
                        $scope.entries[$scope.row_index].value = $scope.value;
                        $scope.entries[$scope.row_index].description = $scope.description;
                        $scope.entries[$scope.row_index].name_sound = $scope.name_sound;
                        $scope.entries[$scope.row_index].note = $scope.note;
                        $scope.entries[$scope.row_index].file = $scope.file;
                    })
                    .error(function () {
                        $scope.showErrorMessage('Error Message', 'Error: Could not connect to server!');
                        return false;
                    });
        }

        return true;
    }

    // Return to entry list from editing form
    $scope.returnToList = function () {
        $scope.edit = false;
    };

    // Display error message
    $scope.showErrorMessage = function (title, message) {
        $scope.msg_title = title;
        $scope.msg_body = message;
        $("#messageModal").modal("show");
    };

});