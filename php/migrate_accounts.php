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
$sql = "SELECT * FROM " . $source . ".info, " . $source . ".account WHERE info_id = acct_info_id";

//echo "$sql;</br>";
$result = $db->query($sql);
//print_r($result3);
$i = 0;
$type_id = 0;
if (is_object($result)) {
    $count = 0;
    while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
        // Inserting entries
        //echo "<br/>" . $row["insert_query"];
        $type_id = (integer) $row["info_type"];
        if ($type_id === 101) {
            $type_id = 201001;
        } else if ($type_id === 102) {
            $type_id = 201002;
        } else {
            $type_id = 201004;
        }
        $i = $db->affect("REPLACE INTO " . $code . "_account_company (id, code, name, note, type_id) VALUES ("
                . $row["info_id"] . ",'"
                . $row["info_id"] . "','"
                . addslashes($row["acct_desc"]) . "','"
                . addslashes($row["info_header"]) . "','"
                . $type_id . "')");
        echo "<br/>" . $i . " - inserting account entry with id " . $row["info_id"] . " and code '" . $row["acct_code"] . "' and name '" . $row["info_name"] . "'";

        $db->affect("DELETE FROM " . $code . "_account_contact WHERE company_id = " . $row["info_id"]);
        $db->affect("DELETE FROM " . $code . "_account_branch WHERE company_id = " . $row["info_id"]);
        $db->affect("DELETE FROM " . $code . "_account_coordinate WHERE company_id = " . $row["info_id"]);

        if (strlen($row["info_attn"]) > 1) {
            $i = $db->affect("REPLACE INTO " . $code . "_account_contact (company_id, name) VALUES ("
                    . $row["info_id"] . ",'"
                    . addslashes($row["info_attn"]) . "')");
            echo "<br/>" . $i . " - inserting contact info entry with id " . $row["info_id"] . " and name '" . $row["info_attn"] . "'";
        }

        if (strlen($row["info_addr"]) > 1) {
            $i = $db->affect("REPLACE INTO " . $code . "_account_branch (company_id, type_id, address, city, country_id) VALUES ("
                    . $row["info_id"] . ","
                    . "203001" . ",'"
                    . addslashes($row["info_addr"]) . "',"
                    . "''" . ","
                    . "0" . ")");
            echo "<br/>" . $i . " - inserting address info entry with id " . $row["info_id"] . " and address '" . $row["info_header"] . "'";
        }
        
        if (strlen($row["info_email1"]) > 0) {
            $i = $db->affect("REPLACE INTO " . $code . "_account_coordinate (company_id, type_id, name) VALUES ("
                    . $row["info_id"] . ","
                    . "208004" . ",'"
                    . ($row["info_email1"]) . "')");
            echo "<br/>" . $i . " - inserting coordinate info entry with id " . $row["info_id"] . " and name '" . $row["info_email1"] . "'";
        }
        
        if (strlen($row["info_cell"]) > 0) {
            $i = $db->affect("REPLACE INTO " . $code . "_account_coordinate (company_id, type_id, name) VALUES ("
                    . $row["info_id"] . ","
                    . "208002" . ",'"
                    . addslashes($row["info_cell"]) . "')");
            echo "<br/>" . $i . " - inserting coordinate info entry with id " . $row["info_id"] . " and name '" . $row["info_cell"] . "'";
        }
        
        if (strlen($row["info_phone1"]) > 0) {
            $i = $db->affect("REPLACE INTO " . $code . "_account_coordinate (company_id, type_id, name) VALUES ("
                    . $row["info_id"] . ","
                    . "208001" . ",'"
                    . addslashes($row["info_phone1"]) . "')");
            echo "<br/>" . $i . " - inserting coordinate info entry with id " . $row["info_id"] . " and name '" . $row["info_phone1"] . "'";
        }
        
        if (strlen($row["info_phone2"]) > 0) {
            $i = $db->affect("REPLACE INTO " . $code . "_account_coordinate (company_id, type_id, name) VALUES ("
                    . $row["info_id"] . ","
                    . "208001" . ",'"
                    . addslashes($row["info_phone2"]) . "')");
            echo "<br/>" . $i . " - inserting coordinate info entry with id " . $row["info_id"] . " and name '" . $row["info_phone2"] . "'";
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
