<?php

// Unicode support
header("content-type: text/html; charset=UTF-8");

// Connecting to databse using helper package
require_once("database.php");
$db = new Database;

// Parameters data
require_once("tools.php");
$params = Tools::getParams($isBase64);

// Application code
$code = "";
if (isset($params["code"])) {
    $code = $params["code"];
} else {
    die("Applicaton code is not available!");
}

// source table
$source = "";
if (isset($params["source"])) {
    $source = $params["source"];
} else {
    die("source db is not available!");
}

// Querying and building insert statements
$sql = "select * FROM " . $source . ".item it";

//echo "$sql;</br>";
$result = $db->query($sql);
//print_r($result3);
$i = 0;
$currency_id = 0;
if (is_object($result)) {
    $count = 0;
    while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
        // Inserting entries
        //echo "<br/>" . $row["insert_query"];
        $i = $db->affect("REPLACE INTO " . $code . "_inventory_item (id, code, name) VALUES ("
                . $row["item_id"] . ",'"
                . $row["item_code"] . "','"
                . addslashes($row["item_desc"]) . "')");
        echo "<br/>" . $i . " - inserting item entry with id " . $row["item_id"] . " and code '" . $row["item_code"] . " and description '" . $row["item_desc"] . "'";

        $db->affect("DELETE FROM " . $code . "_inventory_amount WHERE item_id = " . $row["item_id"]);

        if ($row["item_sale"] != 0.0) {
            $currency_id = (integer) $row["item_curr_id"];
            if ($currency_id === 1) {
                $currency_id = 403002;
            } else if ($currency_id === 2) {
                $currency_id = 403001;
            } else {
                $currency_id = 403002;
            }
            $i = $db->affect("REPLACE INTO " . $code . "_inventory_amount (item_id, type_id, amount, tax_id, unit_id, currency_id) VALUES ("
            . $row["item_id"] . ","
            . 305002 . "," // selling price
            . $row["item_sale"] . ","
            . 315001 . "," // vat 10%
            . 312001 . "," // piece
            . $currency_id . ")");

            echo "<br/>" . $i . " - inserting item amount entry with id " . $row["item_id"] . " and code '" . $row["item_code"] . " and amount '" . $row["item_sale"] . "'";
        }

        echo "<br/>";
        
        $count++;
        if ($count >= 1000) {
            $count = 0;
            $db->close();
            $db = new Database;
        }
    }
}

// Closing connection
$db->close();
