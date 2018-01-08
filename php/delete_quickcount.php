<?php

// Connecting to databse using helper package
require_once("database.php");
$db = new Database;

// Parameters data
//echo "query get: [";
//print_r(json_decode($_GET["params"], true));
//echo "]\n";
// JSON parameters array
//$params = array();
//if (isset($_GET["params"]) && $_GET["params"] != "") {
//    $params = json_decode($_GET["params"], true);
//} else {
//    $data = file_get_contents("php://input");
//    $params = json_decode($data, true);
//}
//if (count($params) === 0) {
//    die("HTTP request data does not exist!");
//}
require_once("tools.php");
$params = Tools::getParams($isBase64);

// Application code
$code = "";
if (isset($params["code"])) {
    $code = $params["code"];
} else {
    die("Applicaton code is not available!");
}

// Dropping tables
if (strlen($code) > 0) {
    $db->affect("DROP TABLE IF EXISTS " . $code . "_account_branch");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_account_file");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_account_coordinate");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_account_contact");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_account_company");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_inventory_file");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_inventory_amount");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_inventory_quantity");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_inventory_package");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_inventory_item");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_parameter_group");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_parameter_entry");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_payment");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_banknote");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_item");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_journal");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_project");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_file");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_perpetual");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_order");
    $db->affect("DROP TABLE IF EXISTS " . $code . "_transaction_entry");
}

// DB creation successful
print("success");

// Closing connection
$db->close();
