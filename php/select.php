<?php

// Unicode support
header("content-type: text/html; charset=UTF-8");

// Connecting to databse using helper package
require_once("database.php");
$db = new Database;

// Parameters data
require_once("tools.php");
$params = Tools::getParams($isBase64);

// Building the query
$sql = $db->selectStatement($db, $params);
//echo "SQL: [$sql]\n";

// Executing the query
$result = $db->query($sql);

// Fetching results
$output = array();
if (is_object($result)) {
    while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
        $output[] = $row;
    }
}

// Print JSON encoded output results
ob_start("ob_gzhandler"); // enabling GZip compression
print(Tools::getOutput($output, $isBase64));
ob_end_flush(); // flushing compressed output

// Free result set
if (is_object($result)) {
    $result->free();
}

// Closing connection
$db->close();
