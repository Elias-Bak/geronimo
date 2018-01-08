<?php

// Unicode support
header("content-type: text/html; charset=UTF-8");

// Connecting to databse using helper package
require_once("database.php");
$db = new Database;

// Parameters data
require_once("tools.php");
$params = Tools::getParams($isBase64);

// Building SQL query
$sql = $db->updateStatement($db, $params);
//echo "SQL: [$sql]\n";

// Executing SQL query
$result = $db->affect($sql);

// Print result
if (isset($result)) {
    print($result);
}

// Free result set
if (is_object($result)) {
    $result->free();
}

// Closing connection
$db->close();
