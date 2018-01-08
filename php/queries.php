<?php

// Unicode support
header("content-type: text/html; charset=UTF-8");

// Connecting to databse using helper package
require_once("database.php");
$db = new Database;
//print("test 01");

// Parameters data
require_once("tools.php");
$params = Tools::getParams($isBase64);
//echo "Parameters: [$params]\n";
//echo "Parameters Count: " . count($params) . "</br>";
// http://localhost/geronimo/geronimo/php/queries.php?params={%221%22:{%22type%22:%22select%22,%22code%22:%22emb01_%22,%22value%22:%221%22},%222%22:{%22type%22:%22insert%22,%22code%22:%22emb01_%22,%22value%22:%221%22}}
// http://localhost/geronimo/geronimo/php/queries.php?params={%221%22:{%22type%22:%22select%22,%22table%22:[%22emb01_inventory_item%22]},%222%22:{%22type%22:%22select%22,%22table%22:[%22emb01_account_company%22]}}
//print("test 02");

if (is_array($params) && count($params) > 0) {
    $result = array();
    //error_log("params: ". count($params));
    foreach ($params as $entry) {
        //echo "entry: [$entry]\n";
        //print($entry["type"]);        
        if ($entry["type"] === "insert") {
            $sql = $db->insertStatement($db, $entry);
            $result[] = $db->affect($sql);
            //if (isset($result)) {
            //    print(": " . $result . "</br>");
            //}
        } else if ($entry["type"] === "update") {
            $sql = $db->updateStatement($db, $entry);
            $result[] = $db->affect($sql);
            //if (isset($result)) {
            //    print(": " . $result . "</br>");
            //}
        } else if ($entry["type"] === "delete") {
            $sql = $db->deleteStatement($db, $entry);
            $result[] = $db->affect($sql);
            //if (isset($result)) {
            //    print(": " . $result . "</br>");
            //}
        } else {
            // Building the query
            $sql = $db->selectStatement($db, $entry);
            //echo "SQL: [$sql]\n";
            
            // Executing the query
            $rows = $db->query($sql);

            // Fetching results
            $output = array();
            if (is_object($rows)) {
                while ($row = $rows->fetch_array(MYSQLI_ASSOC)) {
                    $output[] = $row;
                }
            }
            $result[] = $output;
        }        
    }
    
    // logs
    //foreach ($result as $r) {
    //    error_log("result: ". Tools::getOutput($r, $isBase64));
    //}
    //error_log("all results: ". Tools::getOutput($result, $isBase64));
        
    // Print JSON encoded output results
    if (isset($result)) {
        ob_start("ob_gzhandler"); // enabling GZip compression
        print(Tools::getOutput($result, $isBase64));
        ob_end_flush(); // flushing compressed output
        //    print_r($result);
        //    error_log("params: ". print_r($result));
    }
    
    // Free result set
    if (is_object($result)) {
        $result->free();
    }
}
//print("test 03");

// Closing connection
$db->close();
